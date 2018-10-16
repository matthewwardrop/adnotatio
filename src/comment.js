const uuid = require('uuid/v4');

import TextAnnotation from './annotations/text';
const uuid_v4 = require('uuid/v4');

export default class Comment {

    constructor(text, author=null, reply_to=null, uuid=null) {
        this.uuid = uuid || uuid_v4();
        this.text = text;
        this.author = author;
        this.reply_to = reply_to;
        this.replies = [];
        this.annotations = [];
    }

    asReply = (comment) => {
        this.reply_to = comment.constructor.name === "Comment" ? comment.uuid : comment;
    }

    addReply = (reply) => {
        reply.asReply(this);
        this.replies.push(reply);
    }

    addAnnotation = (annotation) => {
        this.annotations.push(annotation);
    }

    toJSON = () => {
        return {
            uuid: this.uuid,
            text: this.text,
            author: this.author,
            reply_to: this.reply_to,
            replies: this.replies.map(reply => {return reply.toJSON()}),
            annotations: this.annotations.map(annotation => {return annotation.toJSON()}),
        }
    }

    static fromJSON = (json) => {
        let comment = new Comment(json.text, json.author, json.reply_to, json.uuid);
        comment.replies = (json.replies || []).map(reply => {
            return Comment.fromJSON(reply);
        });
        comment.annotations = (json.annotations || []).map(annotation => {
            return TextAnnotation.fromSpec(annotation);
        })
        return comment;
    }
}
