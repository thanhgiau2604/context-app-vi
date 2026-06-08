type PromptOptions = {
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export function buildVietnameseContextoPrompt(options: PromptOptions = {}): string {
  const topicLine = options.topic ? `Chủ đề gợi ý: ${options.topic}.` : "";
  const diffLine =
    options.difficulty === "easy"
      ? "Chọn keyword phổ biến, dễ nhận biết."
      : options.difficulty === "hard"
        ? "Chọn keyword ít phổ biến hơn, thú vị hơn."
        : "";

  return `Bạn là hệ thống tạo dữ liệu cho game đoán từ tiếng Việt giống Contexto.

${topicLine}
${diffLine}

Hãy tạo 1 keyword bí mật và 500 từ/cụm từ tiếng Việt liên quan, sắp xếp theo mức độ liên quan giảm dần.

Yêu cầu:
- Keyword phải gồm đúng 2 từ tiếng Việt.
- Keyword phải thông dụng, không quá chuyên ngành, không phản cảm.
- Mỗi related term dài tối đa 3 từ (1, 2 hoặc 3 từ đều được).
- Related terms phải thông dụng trong tiếng Việt.
- Không trùng lặp bất kỳ term nào.
- Không dùng từ tiếng Anh nếu không thật sự phổ biến ở Việt Nam.
- Không đưa keyword vào relatedTerms.
- Rank càng nhỏ càng gần keyword. relatedTerms bắt đầu từ rank 2.
- relatedTerms phải có đúng 500 item, rank từ 2 đến 501.

Output JSON hợp lệ, không giải thích gì thêm:

{
  "keyword": "...",
  "relatedTerms": [
    { "term": "...", "rank": 2 },
    { "term": "...", "rank": 3 }
  ]
}`;
}
