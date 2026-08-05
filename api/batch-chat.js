// api/batch-chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请使用 POST' });
  }

  const { baseUrl, apiKey, model, messages } = req.body;
  if (!baseUrl || !apiKey || !model || !messages) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      // 按 [SEP] 分割成多条回复
      const replies = content.split('[SEP]').map(s => s.trim()).filter(s => s.length > 0);
      if (replies.length === 0) {
        replies.push(content); // 如果没有分隔符，直接返回整条
      }
      return res.status(200).json({ replies });
    } else {
      return res.status(500).json({ error: data.error?.message || 'AI 返回异常' });
    }
  } catch (err) {
    return res.status(500).json({ error: '服务器繁忙' });
  }
}