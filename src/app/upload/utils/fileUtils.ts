import { detectNewline } from 'detect-newline'
import iconv from 'iconv-lite'

export const cleanDescription = (description: string): string => {
  // Remove date patterns like 26/09, 26/09/2023, 15:54, etc.
  return description
    .replace(/\d{1,2}\/\d{1,2}(\/\d{4})?\s*\d{2}:\d{2}/g, '')  // Remove date and time
    .replace(/\d{1,2}\/\d{1,2}(\/\d{4})?/g, '')  // Remove date
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim()  // Remove leading/trailing whitespace
}

export const processFileContent = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Detect line endings
  const lineEnding = detectNewline(buffer.toString())

  if (lineEnding !== '\n') {
    console.warn('File does not use Unix (LF) line endings')
    // Convert CRLF to LF if needed
    const content = buffer.toString().replace(/\r\n/g, '\n')
    buffer.write(content, 0)
  }

  // Convert to UTF-8 if needed
  let content = iconv.decode(buffer, 'utf-8')
  if (content.includes('�')) {
    
    // If we see replacement characters, try other common encodings
    content = iconv.decode(buffer, 'latin1')
  }
  console.log(content)
  return content
}
