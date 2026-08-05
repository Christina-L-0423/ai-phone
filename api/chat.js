// api/chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请使用 POST' });
  }

  const { action, baseUrl, apiKey, model, message, messages, stream = false } = req.body;

  if (!baseUrl || !apiKey) {
    return res.status(400).json({ error: '缺少 API 地址或 Key' });
  }

  // 拉取模型
  if (action === 'models') {
    try {
      const response = await fetch(baseUrl + '/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      return res.status(200).json({ models: data.data || [] });
    } catch (err) {
      return res.status(500).json({ error: '拉取模型失败' });
    }
  }

  // 聊天
  if (action === 'chat') {
    // 直接使用前端传来的 messages（已包含 system）
    let chatMessages = messages;
    if (!chatMessages || chatMessages.length === 0) {
      if (message) {
        chatMessages = [{ role: 'user', content: message }];
      } else {
        return res.status(400).json({ error: '缺少消息内容' });
      }
    }

    if (!model) {
      return res.status(400).json({ error: '缺少模型' });
    }

    try {
      const payload = {
        model: model,
        messages: chatMessages,  // 直接转发，不修改
        max_tokens: 1000,
        stream: stream
      };

      const response = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } else {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          return res.status(200).json({ reply: data.choices[0].message.content });
        } else {
          return res.status(500).json({ error: data.error?.message || 'AI 返回异常' });
        }
      }
    } catch (err) {
      if (stream) {
        res.write(`data: {"error":"服务器繁忙"}\n\n`);
        res.end();
      } else {
        return res.status(500).json({ error: '服务器繁忙' });
      }
    }
  }

  return res.status(400).json({ error: '未知动作' });
}