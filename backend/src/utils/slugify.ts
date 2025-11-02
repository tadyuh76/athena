export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // bỏ dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-") // thay ký tự đặc biệt bằng dấu gạch ngang
    .replace(/^-+|-+$/g, ""); // bỏ dấu - ở đầu/cuối
}
