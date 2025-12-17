
// Extend window to include mammoth (loaded via CDN)
declare global {
  interface Window {
    mammoth: any;
  }
}

export async function parseFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      if (!window.mammoth) {
        reject(new Error("Docx parser (mammoth) not loaded."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then((result: any) => resolve(result.value))
          .catch((err: any) => reject(err));
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("不支持的文件格式。请上传 .txt 或 .docx 文件。"));
    }
  });
}
