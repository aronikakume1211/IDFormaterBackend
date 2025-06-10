const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.processPdf = async (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../../src/python/pdf_processor.py');
    const imagesOutputDir = path.join(__dirname, '../../public/images');
    
    if (!fs.existsSync(imagesOutputDir)) {
      fs.mkdirSync(imagesOutputDir, { recursive: true });
    }
    
    if (!fs.existsSync(pdfPath)) {
      return reject(new Error(`PDF file not found: ${pdfPath}`));
    }
    
    const pythonPath = process.env.PYTHONPATH || '';
    const userLocalPath = path.join(os.homedir(), '.local/lib/python3.12/site-packages');
    
    const env = {
      ...process.env,
      PYTHONPATH: pythonPath ? `${pythonPath}:${userLocalPath}` : userLocalPath
    };
    
    const pythonProcess = spawn('python3', [
      pythonScriptPath,
      pdfPath,
      imagesOutputDir
    ], { env });
    
    let dataString = '';
    let errorString = '';
    
    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      dataString += output;
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      errorString += error;
      console.error(`Python stderr: ${error}`);
    });
    
    pythonProcess.on('close', (code) => {
      
      if (code !== 0) {
        console.error(`Error: ${errorString}`);
        return reject(new Error(`Python process failed: ${errorString}`));
      }
      
      try {
        const result = JSON.parse(dataString);
        
        if (result.en && result.en.images) {
          for (const [key, value] of Object.entries(result.en.images)) {
            if (value) {
              result.en.images[key] = value;
            }
          }
        }
        
        if (result.am && result.am.images) {
          for (const [key, value] of Object.entries(result.am.images)) {
            if (value) {
              result.am.images[key] = value;
            }
          }
        }
        
        resolve(result);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        console.error('Raw output:', dataString);
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(error);
    });
  });
}; 