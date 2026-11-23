export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/orders' && request.method === 'GET') {
      const phone = url.searchParams.get('phone');
      const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
      let orders = JSON.parse(raw);
      if (phone) {
        orders = orders.filter((o) => o.customerPhone === phone);
      }
      return new Response(JSON.stringify({ ok: true, orders }), { headers: corsHeaders });
    }

    if (url.pathname === '/api/orders' && request.method === 'POST') {
      const body = await request.json();
      const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
      const orders = JSON.parse(raw);
      orders.unshift({
        ...body,
        status: 'pending',
        createdAt: body.createdAt || new Date().toISOString(),
      });
      await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders.slice(0, 200)));
      return new Response(JSON.stringify({ ok: true, order: body }), { headers: corsHeaders });
    }

    if (url.pathname.endsWith('/cancel') && request.method === 'POST') {
      const parts = url.pathname.split('/');
      const orderId = parts[3];
      const raw = (await env.NINJA_KV.get('ORDERS_LIST')) || '[]';
      const orders = JSON.parse(raw).map((o) =>
        o.id === orderId && o.status === 'pending' ? { ...o, status: 'cancelled' } : o
      );
      await env.NINJA_KV.put('ORDERS_LIST', JSON.stringify(orders));
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (url.pathname === '/api/wallet/withdraw' && request.method === 'POST') {
      const body = await request.json();
      const raw = (await env.NINJA_KV.get('WITHDRAW_REQUESTS')) || '[]';
      const list = JSON.parse(raw);
      list.unshift({ ...body, status: 'pending', createdAt: new Date().toISOString() });
      await env.NINJA_KV.put('WITHDRAW_REQUESTS', JSON.stringify(list));
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: false, message: 'Not Found' }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
