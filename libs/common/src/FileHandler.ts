import fs from 'node:fs';

export class FileHandler {
  public writeFile(file_name_with_path: string, content: string): void {
    const writeStream = fs.createWriteStream(file_name_with_path, { flags: 'a'});
    
    writeStream.write(content+"\n")
    
    writeStream.end();
    
    writeStream.on("finish", () => {
      console.log('All data written successfully.');
    })
    
    writeStream.on("error", (err) => {
      console.error('Error writing to file:', err);
    })
  }

  public checkFileExist(file_name_with_path: string): boolean {
    return fs.existsSync(file_name_with_path);
  }

  public fileSizeInMB(file_name_with_path: string): number {
    const file_size_in_byte = fs.statSync(file_name_with_path).size;
    const file_size_in_mb = parseInt((file_size_in_byte/(1024 * 1024)).toString());

    return file_size_in_mb;
  }

  public renameFile(ole_file_name_with_path: string, new_file_name_with_path: string): void {
    fs.renameSync(ole_file_name_with_path, new_file_name_with_path);
  }
}