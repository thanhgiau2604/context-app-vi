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
Hãy tạo 1 keyword bí mật và đúng 499 từ/cụm từ tiếng Việt liên quan, sắp xếp theo mức độ liên quan giảm dần.
Yêu cầu:
- Keyword phải gồm đúng 2 từ tiếng Việt.
- Keyword phải thông dụng, không quá chuyên ngành, không phản cảm.
- Mỗi từ liên quan dài tối đa 3 từ (1, 2 hoặc 3 từ đều được).
- Các từ liên quan phải thông dụng trong tiếng Việt.
- KHÔNG trùng lặp bất kỳ từ nào (không lặp lại từ đã có).
- Không dùng từ tiếng Anh nếu không thật sự phổ biến ở Việt Nam.
- KHÔNG đưa keyword lặp lại trong danh sách từ liên quan.
- Sắp xếp theo mức độ liên quan GIẢM DẦN: từ đầu tiên gần keyword nhất.
- Phải có CHÍNH XÁC 499 từ liên quan.
Định dạng output: một dòng duy nhất, KHÔNG giải thích, KHÔNG xuống dòng.
Keyword đứng đầu tiên, kế tiếp là 499 từ liên quan, MỖI phần tử cách nhau bởi dấu phẩy:
keyword, từ1, từ2, từ3, …, từ499`;
}
