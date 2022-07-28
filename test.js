const userLeft = false;
const userWatchingCatMeme = false;

let watchTutorialPromise = new Promise((resolve, reject) => {
  if (userLeft) {
    reject({
      name: 'User Left',
      message: ':('
    })
  } else if (userWatchingCatMeme) {
    reject({
      name: 'User Watching Cat Meme',
      message: 'Tutorial < Cat'
    })
  } else {
    resolve('Thumbs up and Subscribe')
  }
