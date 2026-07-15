/**
 * DeepSeek AI 智能分析服务
 * 调用 DeepSeek API 进行基金智能分析与推荐
 */
class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = 'deepseek-chat';
  }

  /**
   * 检查 API Key 是否配置
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * 构建基金分析师提示词
   */
  buildPrompt(userProfile, fundList) {
    const profileStr = `- 风险承受能力：${this.getRiskLabel(userProfile.riskLevel)}
- 投资期限：${this.getTermLabel(userProfile.term)}
- 目标年化收益：${userProfile.targetReturn || '无要求'}%
- 行业偏好：${(userProfile.industries || []).join('、') || '不限'}
- 基金类型偏好：${(userProfile.types || []).join('、') || '不限'}
- 投资风格：${this.getStyleLabel(userProfile.investStyle) || '不限'}
- 预计投资金额：${userProfile.budget ? userProfile.budget + '万元' : '不限'}`;

    const fundStr = fundList.map((f, i) =>
      `基金${i + 1}：
  代码：${f.code}
  名称：${f.name}
  类型：${f.type || '未知'}
  最新净值：${f.nav || '未知'}
  近1年收益：${f.yearReturn != null ? f.yearReturn.toFixed(2) + '%' : '未知'}
  基金规模：${f.fundScale || '未知'}
  基金经理：${f.manager || '未知'}
  风险等级：${f.riskLevel || '未知'}
  成立日期：${f.establishDate || '未知'}
  评级：${f.rating ? f.rating + '星' : '未知'}
  管理费率：${f.fee || '未知'}`
    ).join('\n\n');

    return `你是一位资深的基金分析师，拥有10年以上的公募基金研究经验，精通基金评价体系和资产配置。

## 用户画像
${profileStr}

## 候选基金列表
以下是为用户筛选出的候选基金，请基于用户画像进行专业分析和推荐：

${fundStr}

## 分析要求

请从以下四个维度对每只基金进行评分（每个维度0-10分）：
1. **收益能力**：基于历史收益表现、收益稳定性评估
2. **风险控制**：基于最大回撤、波动率等风险评估
3. **基金经理**：基于经理从业经验、历史业绩评估
4. **规模流动性**：基于基金规模、日均成交量评估

## 输出要求

请严格按照 JSON 格式输出，不要包含任何其他内容：

{
  "recommendations": [
    {
      "fund_code": "基金代码",
      "fund_name": "基金名称",
      "scores": {
        "earnings": 收益能力评分(0-10),
        "risk_control": 风险控制评分(0-10),
        "manager": 基金经理评分(0-10),
        "liquidity": 规模流动性评分(0-10)
      },
      "total_score": 综合得分(0-40),
      "reason": "推荐理由，结合用户画像说明为什么推荐这只基金",
      "risk_warning": "该基金的主要风险提示"
    }
  ],
  "top5": ["基金代码1", "基金代码2", "基金代码3", "基金代码4", "基金代码5"],
  "overall_advice": "整体配置建议，基于用户画像给出资产配置比例和投资策略建议",
  "market_outlook": "当前市场环境分析及未来展望",
  "risk_declaration": "免责声明：以上分析由AI模型生成，仅供参考学习，不构成任何投资建议。历史业绩不代表未来表现，市场有风险，投资需谨慎。"
}`;
  }

  /**
   * 调用 DeepSeek API 进行基金分析
   */
  async analyzeFunds(userProfile, fundList) {
    if (!this.isConfigured()) {
      throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置');
    }

    const prompt = this.buildPrompt(userProfile, fundList);

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的基金分析师。请总是以有效的JSON格式输出分析结果。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        let errMsg = `DeepSeek API 调用失败 (${response.status})`;
        try {
          const errJson = JSON.parse(errBody);
          errMsg = errJson.error?.message || errMsg;
        } catch { /* ignore parse error */ }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('DeepSeek API 返回数据异常');
      }

      // 解析 JSON 响应
      let result;
      try {
        result = JSON.parse(content);
      } catch {
        // 尝试从返回内容中提取 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI 响应解析失败，请重试');
        }
      }

      return result;
    } catch (err) {
      if (err.message.includes('DeepSeek') || err.message.includes('fetch')) {
        throw err;
      }
      throw new Error(`AI 分析服务异常: ${err.message}`);
    }
  }

  /**
   * 获取风险等级标签
   */
  getRiskLabel(level) {
    const map = { conservative: '保守型', steady: '稳健型', balanced: '平衡型', aggressive: '进取型', radical: '激进型' };
    return map[level] || level || '未知';
  }

  /**
   * 获取投资期限标签
   */
  getTermLabel(term) {
    const map = { '1y': '1年以内', '1-3y': '1-3年', '3-5y': '3-5年', '5-10y': '5-10年', '10y+': '10年以上' };
    return map[term] || term || '未知';
  }

  /**
   * 获取投资风格标签
   */
  getStyleLabel(style) {
    const map = { value: '价值风格', growth: '成长风格', balanced: '均衡风格', theme: '行业主题' };
    return map[style] || style || '不限';
  }
}

module.exports = new DeepSeekService();
