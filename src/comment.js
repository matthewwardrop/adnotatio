'use strict';

const uuid = require('uuid/v4');

import DomHighlightAnnotation from './annotations/dom_highlight';
const uuid_v4 = require('uuid/v4');

export default class Comment {

    constructor({uuid=null, replyTo=null, context=null, text=null, annotations=null,
                 authorName=null, authorEmail=null, authorAvatar=null, tsCreated=null, tsUpdated=null,
                 isResolved=false, isArchived=false, state=false, replies=null}={}) {
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
        this.replies = replies || [];

        this.state = state || {};
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
            state: json.state,
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
            isDraft: this.isDraft
        }
        if (complete) {
            json.replies = this.replies.map(reply => {return reply.toJSON()});
            json.state = this.state;
        }
        return json;
    }

    copy = () => {
        return Comment.fromJSON(this.toJSON(true));
    }

    applyPatch = (patch) => {
        for(let [attribute, value] of Object.entries(patch)) {
            if (!this.hasOwnProperty(attribute))
                throw new CommentAttributeDoesNotExist(attribute);
            this[attribute] = value;
        }
        return this;
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

    renderAnnotations = (root, bglayer, fglayer, onClick, onMouseOver, onMouseOut) => {
        let bbox;
        this.annotations.forEach((annotation) => {
            let annotationElement = annotation.render(
                root, bglayer, fglayer,
                () => {onClick(this.uuid)},
                () => {onMouseOver(this.uuid)},
                () => {onMouseOut(this.uuid)}
            );
            if (annotationElement) {
                annotationElement.dataset.commentId = this.uuid;
                bbox = annotation.getBoundingBox(root, bglayer, fglayer).union(bbox);
            }
        });
        this.state.annotationBBox = bbox;
        this.state.isOrphan = (bbox === undefined);
    }

    get annotationDescription() {
        return this.annotations[0].description;
    }

}
