const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/posts', (req, res) => {
	Blogpost
	.find()
	.exec()
	.then(blogpost => {
		res.json(blogpost)
	})
	.catch(
		err => {
			console.error(err);
			res.status(500).json({message: "Internal server error"})
		});
});

app.get('/posts/:id', (req, res) => {
	Blogpost
	.findById(req.params.id)
	.exec()
	.then(blogpost => res.json(blogpost))
	.catch(err => {
		console.error(err);
			res.status(500).json({message: "Internal server error"})
	});
});

app.post('/posts', (req, res) => {
	const requiredFields = ['title', 'content', 'author'];
	requiredFields.forEach(field => {
		if (!(field in req.body && req.body[field])) {
			return res.status(400).json({message: `Must specify value for ${field}`});
		}
	});

	Blogpost
	  .create({
	  	title: req.body.title,
	  	content: req.body.content,
	  	author: req.body.author
	  })
	  .then(
	  	blogpost => res.status(201).json(blogpost.apiRepr()))
	  .catch (err => {
	  	console.error(err);
	  	res.status(500).json({message: "Internal server error"});
	  });
});

app.put('/posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];

  updateableFields.forEach(field => {
  	if (field in req.body) {
  		toUpdate[field] = req.body[field];
  	}
  });

  Blogpost
  	.findByIdAndUpdate(req.params.id, {$set: toUpdate})
  	.exec()
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
	Blogpost
	  .findByIdAndRemove(req.params.id)
      .exec()
      .then(blogpost => res.status(204).end())
      .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};