import { UnauthorizedException } from '@nestjs/common';
import fileType from 'magic-bytes.js';
import { GuessedFile } from 'magic-bytes.js/dist/model/tree';
import { extname } from 'path';
import fs = require('fs');

export const imageFileFilter = (req, file, callback) => {
  console.log();
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|JPG|JPEG)$/)) {
    return callback(new UnauthorizedException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const check_magic_numbers = (path: string) => {
  const mimetypes: GuessedFile[] = fileType(fs.readFileSync(path));
  if (mimetypes.length < 1) {
    fs.unlink(path, () => {
      console.log('Unapropriate file deleted');
    });
    return false;
  }
  return true;
};
