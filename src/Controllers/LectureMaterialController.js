const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createFolderIfNotExist = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    return true;
  }
  return false;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join('C:/Users/DELL/OneDrive - University of Kelaniya/Desktop/uploads', req.body.folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage }).single('file');

// Parse both files and fields
const parseForm = multer().none();

exports.upload = (req, res) => {
  parseForm(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to parse form data', error: err });
    }

    // Log the request body to check incoming data
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed', error: err });
      }
      res.status(200).json({ message: 'Files uploaded successfully', files: req.file });
    });
  });
};

// Create folder
exports.createFolder = (req, res) => {
  try {
    const folderName = req.body.folder;
    if (!folderName) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    const folderPath = path.join('C:/Users/DELL/OneDrive - University of Kelaniya/Desktop/uploads', folderName);
    const folderCreated = createFolderIfNotExist(folderPath);
    if (folderCreated) {
      res.status(200).json({ message: 'Folder created successfully' });
    } else {
      res.status(400).json({ message: 'Folder already exists' });
    }
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get folders
exports.getFolders = (req, res) => {
  const folderPath = path.join('C:/Users/DELL/OneDrive - University of Kelaniya/Desktop/uploads');
  const folders = fs.readdirSync(folderPath);
  res.status(200).json({ folders });
}
