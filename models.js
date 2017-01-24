const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: {type: String, required: true},
	author: {type: String, required: true},
	created: {type: Number, required: true}
});

blogpostSchema.virtual('authorName').get(function(){
	const newName = this.author.split(' ');
	return {
		"firstName": newName[0],
		"lastName": newName[1]
	};
})

blogpostSchema.methods.apiRepr = function() {
	return {
		title: this.title,
		content: this.content,
		author: this.authorName,
		created: this.created
	}
}

const Blogpost = mongoose.model('Blogpost', blogpostSchema);

module.exports = {Blogpost};