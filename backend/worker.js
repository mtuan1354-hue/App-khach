export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: corsHeaders });

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Cấu hình dùng chung cho App Khách & App Tài Xế
      if (pathname === '/api/config' && request.method === 'GET') {
        const raw = await env.NINJA_KV.get('APP_CONFIG');
        const config = raw
          ? JSON.parse(raw)
          : { appName: 'NINJA SHIP', appLogo: '🥷', ratePerKm: 5000 };
        return json({ ok: true, config });
      }

      if (pathname === '/api/config' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const raw = await env.NINJA_KV.get('APP_CONFIG');
        const current = raw
          ? JSON.parse(raw)
          : { appName: 'NINJA SHIP', appLogo: '🥷', ratePerKm: 5000 };
        const nextConfig = { ...current, ...body };
        await env.NINJA_KV.put('APP_CONFIG', JSON.stringify(nextConfig));
        return json({ ok: true, config: nextConfig });
      }

      // 2. Gửi mã OTP xác thực cho cả Khách & Tài Xế
      if (pathname === '/api/otp/request' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const phone = String(body.phone || '').replace(/\D/g, '');
        if (!/^0\d{8,10}$/.test(phone)) {
          return json({ ok: false, message: 'Số điện thoại không hợp lệ' }, 400);
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const raw = (await env.NINJA_KV.get('OTP_CODES')) || '{}';
        const otps = JSON.parse(raw);
        otps[phone] = {
          code,
          role: body.role || 'customer',
          expiresAt: Date.now() + 60000,
        };
        await env.NINJA_KV.put('OTP_CODES', JSON.stringify(otps));
        return json({ ok: true, otp: code, expiresInSec: 60 });
      }

      // 3. Đăng ký / cập nhật hồ sơ Khách hàng & Tài xế (chuẩn định danh CCCD/GPLX/Biển số)
      if (pathname === '/api/register' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (body.role === 'driver' && body.phone) {
          const raw = (await env.NINJA_KV.get('DRIVERS_LIST')) || '[]';
          const drivers = JSON.parse(raw).filter((d) => d.phone !== body.phone);
          const nowTime = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          drivers.unshift({
            phone: body.phone,
            name: body.name || '',
            role: 'driver',
            address: body.address || '',
            lat: body.lat ?? null,
            lng: body.lng ?? null,
            deviceId: body.deviceId || '',
            driverCompliance: body.driverCompliance || null,
            verified: true,
            online: true,
            updatedAt: nowTime,
          });
          await env.NINJA_KV.put('DRIVERS_LIST', JSON.stringify(drivers.slice(0, 100)));
        }
        return json({ ok: true });
      }

      // 4. Cập nhật GPS trực tuyến của Tài xế & Khách
      if (pathname === '/api/location' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (body.role === 'driver' && body.phone) {
          const raw = (await env.NINJA_KV.get('DRIVERS_LIST')) || '[]';
          const drivers = JSON.parse(raw);
          const nowTime = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          let found = false;
          const updated = drivers.map((d) => {
            if (d.phone === body.phone) {
              found = true;
              return {
                ...d,
                name: body.name || d.name,
                address: body.address || d.address,
                lat: body.lat ?? d.lat,
                lng: body.lng ?? d.lng,
                online: body.online !== false,
                updatedAt: nowTime,
              };
            }
            return d;
          });
          if (!found) {
            updated.unshift({
              phone: body.phone,
              name: body.name || body.phone,
              address: body.address || '',
              lat: body.lat ?? null,
              lng: body.lng ?? null,
              online: body.online !== false,
              updatedAt: nowTime,
            });
          }
          await env.NINJA_KV.put('DRIVERS_LIST', JSON.stringify(updated.slice(0, 100)));
        }
        return json({ ok: true });
      }

      // 5. Danh sách tài xế đang trực tuyến (cho App Khách hiển thị "Tài xế gần")
      if (pathname === '/api/drivers' && request.method === 'GET') {
        const raw = (await env.NINJA_KV.get('DRIVERS_LIST')) || '[]';
        const drivers = JSON.parse(raw).filter((d) => d.online !== false);
        return json({ ok: true, drivers });
      }

      // 6. Lấy danh sách đơn (App Khách lọc theo ?phone=..., App Tài Xế lấy các đơn chờ nhận)
      if (pathname === '/api/orders' && request.method === 'GET') {
        const phone = url.searchParams.get('phone');
        const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
        let orders = JSON.parse(raw);
        if (phone) {
          orders = orders.filter((o) => o.customerPhone === phone);
        } else {
          orders = orders.filter(
            (o) => o.status === 'pending' || o.status === 'Đang tìm tài xế Ninja'
          );
        }
        return json({ ok: true, orders });
      }

      // 7. Tạo đơn mới từ App Khách
      if (pathname === '/api/orders' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
        const orders = JSON.parse(raw);
        const newOrder = {
          ...body,
          id: body.id || `NS-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'pending',
          createdAt: body.createdAt || new Date().toISOString(),
        };
        orders.unshift(newOrder);
        await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders.slice(0, 200)));
        return json({
          ok: true,
          order: newOrder,
          verifiedTotal: Number(newOrder.total || 0),
        });
      }

      // 8. Tài xế nhận cuốc (POST /api/orders/accept hoặc /api/orders/:id/accept)
      if (
        (pathname === '/api/orders/accept' || pathname.endsWith('/accept')) &&
        request.method === 'POST'
      ) {
        const body = await request.json().catch(() => ({}));
        const parts = pathname.split('/');
        const orderId = body.orderId || parts[3];
        const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
        let accepted = false;
        const orders = JSON.parse(raw).map((o) => {
          if (o.id === orderId && (o.status === 'pending' || o.status === 'Đang tìm tài xế Ninja')) {
            accepted = true;
            return {
              ...o,
              status: 'accepted',
              driverPhone: body.driverPhone || '',
              driverName: body.driverName || '',
              licensePlate: body.licensePlate || '',
              acceptedAt: new Date().toISOString(),
            };
          }
          return o;
        });
        if (!accepted) {
          return json({ ok: false, message: 'Đơn đã có tài xế khác nhận hoặc đã hủy' }, 409);
        }
        await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders));
        return json({ ok: true });
      }

      // 9. Hoàn thành đơn từ App Tài Xế
      if (
        (pathname === '/api/orders/complete' || pathname.endsWith('/complete')) &&
        request.method === 'POST'
      ) {
        const body = await request.json().catch(() => ({}));
        const parts = pathname.split('/');
        const orderId = body.orderId || parts[3];
        const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
        const orders = JSON.parse(raw).map((o) =>
          o.id === orderId ? { ...o, status: 'completed', completedAt: new Date().toISOString() } : o
        );
        await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders));
        return json({ ok: true });
      }

      // 10. Hủy đơn (giữ nguyên endpoint /api/orders/:id/cancel của bạn)
      if (pathname.endsWith('/cancel') && request.method === 'POST') {
        const parts = pathname.split('/');
        const orderId = parts[3];
        const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
        const orders = JSON.parse(raw).map((o) =>
          o.id === orderId && (o.status === 'pending' || o.status === 'Đang tìm tài xế Ninja')
            ? { ...o, status: 'cancelled' }
            : o
        );
        await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders));
        return json({ ok: true });
      }

      // 11. Yêu cầu rút tiền ví tài xế (giữ nguyên endpoint /api/wallet/withdraw của bạn)
      if (pathname === '/api/wallet/withdraw' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const raw = (await env.NINJA_KV.get('WITHDRAW_REQUESTS')) || '[]';
        const list = JSON.parse(raw);
        list.unshift({ ...body, status: 'pending', createdAt: new Date().toISOString() });
        await env.NINJA_KV.put('WITHDRAW_REQUESTS', JSON.stringify(list));
        return json({ ok: true });
      }

      return json({ ok: false, message: 'Not Found' }, 404);
    } catch (err) {
      return json({ ok: false, message: String(err) }, 500);
    }
  },
};
