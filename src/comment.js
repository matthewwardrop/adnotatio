'use strict';

const uuid = require('uuid/v4');

import DomHighlightAnnotation from './annotations/dom_highlight';
const uuid_v4 = require('uuid/v4');

export default class Comment {

    constructor({uuid=null, replyTo=null, context=null, text=null, annotations=null,
                 authorName=null, authorEmail=null, authorAvatar=null, tsCreated=null, tsUpdated=null,
                 isResolved=false, isArchived=false, isDraft=false, replies=null}={}) {
        this.uuid = uuid || uuid_v4();
        this.replyTo = replyTo;

        this.context = context;

        this.text = text || "";
        this.annotations = annotations || [];

        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.authorAvatar = authorAvatar;

        this.tsCreated = tsCreated || new Date().getTime();
        this.tsUpdated = tsUpdated || new Date().getTime();

        this.isResolved = isResolved;
        this.isArchived = isArchived;

        // Non-serialised attributes
        this.isDraft = isDraft;
        this.replies = replies || [];
    }

    static fromJSON = (json) => {
        return new Comment({
            uuid: json.uuid,
            replyTo: json.replyTo,
            context: json.context,
            text: json.text,
            annotations: (json.annotations || []).map(annotation => {
                return DomHighlightAnnotation.fromSpec(annotation);
            }),
            authorName: json.authorName,
            authorEmail: json.authorEmail,
            authorAvatar: json.authorAvatar,
            tsCreated: json.tsCreated,
            tsUpdated: json.tsUpdated,
            isResolved: json.isResolved,
            isArchived: json.isArchived,
            isDraft: json.isDraft,
            replies: (json.replies || []).map(reply => {
                return Comment.fromJSON(reply);
            })
        });
    }

    toJSON = (complete=false) => {
        let json = {
            uuid: this.uuid,
            replyTo: this.replyTo,
            context: this.context,
            text: this.text,
            annotations: this.annotations.map(annotation => {return annotation.toJSON()}),
            authorName: this.authorName,
            authorEmail: this.authorEmail,
            authorAvatar: this.authorAvatar,
            tsCreated: this.tsCreated,
            tsUpdated: this.tsUpdated,
            isResolved: this.isResolved,
            isArchived: this.isArchived,
            isDraft: this.isDraft,
            replies: this.replies.map(reply => {return reply.toJSON()})
        }
        if (complete) {
            json.replies = this.replies.map(reply => {return reply.toJSON()});
            json.isDraft = this.isDraft;
        }
        return json;
    }

    copy = () => {
        return Comment.fromJSON(this.toJSON(true));
    }

    // Attribute helpers

    asReply = (comment) => {
        this.replyTo = comment.constructor.name === Comment.name ? comment.uuid : comment;
    }

    addReply = (reply) => {
        reply.asReply(this);
        this.replies.push(reply);
    }

    addAnnotation = (annotation) => {
        this.annotations.push(annotation);
    }

}
