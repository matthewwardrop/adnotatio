'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import CommentStorage from '../storage/base';
import LocalCommentStorage from '../storage/local';
import DomHighlightAnnotation from '../annotations/dom_highlight';
import {getViewportOffset} from '../utils/offset';

import CommentBar from './commentbar';


export default class Annotatable extends React.Component {

    static propTypes = {
        authority: PropTypes.string,
        documentId: PropTypes.string,
        documentVersion: PropTypes.string,
        documentAuthorEmails: PropTypes.arrayOf(PropTypes.string),

        useKaTeX: PropTypes.bool,

        storage: (props, propName, componentName) => {
            if (props[propName] !== null && !props[propName] instanceof CommentStorage) {
                return new Error(
                    'Invalid prop `' + propName + '` supplied to' +
                    ' `' + componentName + '`. Must be an instance of CommentStorage or null.'
                );
            }
        }
    }

    constructor(props) {
        super(props);

        // Document context
        this.documentContext = {
            authority: this.props.authority || null,
            documentId: this.props.documentId || null,
            documentVersion: this.props.documentVersion || null,
            documentAuthorEmails: this.props.documentAuthorEmails || null
        }

        // DOM references
        this.wrapper = React.createRef();
        this.document = React.createRef();
        this.bglayer = React.createRef();
        this.fglayer = React.createRef();
        this.commentbar = React.createRef();
        this.commentButton = React.createRef();

        this.storage = this.props.storage || new LocalCommentStorage();

        this.state = {'comments': []}
    }

    // Component lifecycle methods

    componentDidMount() {
      window.addEventListener('resize', this.onWindowResize);
      this.storage.connect(this.documentContext, this.onCommentsUpdate);
      this.componentDidUpdate();
      try {
          this.mutationObserver = new window.MutationObserver(this.onDocumentUpdate);
          this.mutationObserver.observe(this.document.current, { attributes: true, childList: true, subtree: true });
      } catch {}
    }

    componentDidUpdate() {
        while (this.bglayer.current.firstChild) {
            this.bglayer.current.removeChild(this.bglayer.current.firstChild);
        }
        while (this.fglayer.current.firstChild) {
            this.fglayer.current.removeChild(this.fglayer.current.firstChild);
        }
        this.renderAnnotations()
    }

    componentWillUnmount() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            delete this.mutationObserver;
        }
        window.removeEventListener('resize', this.onWindowResize);
        this.storage.disconnect();
    }

    // Component rendering

    renderAnnotations = () => {
        if (this.state.comments.length === 0) return;
        this.state.comments.forEach((comment) => {
            let minOffsetY = Infinity;
            let isOrphan = true;
            comment.annotations.forEach((annotation) => {
                let annotationElement = annotation.render(
                    this.document.current, this.bglayer.current, this.fglayer.current,
                    () => {this.onAnnotationClick(comment.uuid)},
                    () => {this.onAnnotationMouseOver(comment.uuid)},
                    () => {this.onAnnotationMouseOut(comment.uuid)}
                );
                if (annotationElement) {
                    isOrphan = false;
                    annotationElement.dataset.commentId = comment.uuid;
                    minOffsetY = Math.min(minOffsetY, parseFloat(annotationElement.dataset.minOffsetY));
                }
            })
            this.commentbar.current.setCommentAttributes(comment.uuid, minOffsetY === Infinity ? 0 : minOffsetY, isOrphan);
        })

        this.commentbar.current.renderOffsets();
    }

    render() {
        return (
            <div className='adnotatio-wrapper' ref={this.wrapper} onClick={this.onDocumentClick}>
                <div className='adnotatio-document-wrapper'>
                    <button className="adnotatio-comment-button" ref={this.commentButton} onClick={this.onCommentCreate} style={{display: "none"}}><FontAwesomeIcon icon="comment-dots" /></button>
                    <div className="adnotatio-document-bg" ref={this.bglayer} />
                    <div className="adnotatio-document-main" ref={this.document} onMouseUp={this.onDocumentMouseUp}>
                        {this.props.children}
                    </div>
                    <div className="adnotatio-document-fg" ref={this.fglayer} />
                </div>
                {this.state.comments.length > 0 &&
                    <CommentBar comments={this.state.comments} onCommentChange={this.onCommentChange} onCommentReply={this.onCommentReply} focusAnnotations={this.focusAnnotations} unfocusAnnotations={this.unfocusAnnotations} ref={this.commentbar} />
                }
            </div>
        );
    }

    // Global event handlers

    onWindowResize = () => {
        this.forceUpdate();
    }

    onDocumentUpdate = () => {
        this.forceUpdate();
    }

    onDocumentClick = (e) => {
        // Add annotation for image. // TODO!
        if (this.commentbar.current !== null)
            this.commentbar.current.activateComment(null);
    }

    onDocumentMouseUp = (e) => {
        // Check for text selection, and if present, offer opportunity to create
        // text highlight annotation.
        let currentSelection = window.getSelection();
        if (currentSelection.isCollapsed) {
            this.commentButton.current.style.display = "none";
        } else {
            this.commentButton.current.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) + currentSelection.getRangeAt(0).getClientRects()[0].y - this.wrapper.current.offsetTop) + 'px';
            this.commentButton.current.dataset.annotationType = 'text_highlight';
            this.commentButton.current.style.display = 'block';
        }
    }

    onCommentCreate = (e) => {
        if (this.commentButton.current.dataset.annotationType !== 'text_highlight') {
            throw "Adnotatio only support textual highlights for now."
        }

        let selection = window.getSelection();
        if (selection.toString() === "") {
            return;
        }

        let comment = this.storage.create();
        comment.isDraft = true;

        for (let i = 0; i < selection.rangeCount; i++) {
            let range = selection.getRangeAt(i);
            comment.addAnnotation(DomHighlightAnnotation.fromRange(range, this.document.current));
        }

        this.storage.stage(comment);

        this.commentButton.current.style.display = "none";
        this.commentButton.current.dataset.annotationType = null;
        selection.empty();
    }

    // Hooks and event handlers called by children components

    onCommentsUpdate = (comments) => {
        // Convert a list of comments to a nested structure

        let out = {};

        comments = comments.sort((a,b) => {
            if (a.replyTo === null && b.replyTo !== null) {
                return -1;
            } else if (a.replyTo !== null && b.replyTo === null) {
                return 1;
            } else {
                return 0;
            }
        })

        comments.forEach((comment) => {
            if (comment.replyTo) {
                out[comment.replyTo].addReply(comment.copy());
            } else {
                out[comment.uuid] = comment.copy();
            }
        })

        this.setState({'comments': Object.values(out).filter(comment => {return !comment.isResolved})})
    }

    onCommentChange = (action, comment) => {
        if (action == 'discard') {
            this.storage.discard(comment);
        } else if (action == 'update') {
            if (comment.isDraft) {
                this.storage.add(comment);
            } else {
                this.storage.update(comment);
            }
        } else {
            throw "Unknown action: " + action;
        }
    }

    onCommentReply = (host_uuid) => {
        if (!this.storage.exists(host_uuid)) {
            throw "Invalid comment: " + e.target.dataset.commentId
        }

        let reply = this.storage.create({replyTo: host_uuid});
        this.storage.stage(reply);
    }

    focusAnnotations = (uuid) => {
        this.fglayer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "true";
        })
    }

    unfocusAnnotations = (uuid) => {
        this.fglayer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "false";
        })
    }

    onAnnotationClick = (uuid) => {
        // activate comment
        this.commentbar.current.activateComment(uuid);
    }

    onAnnotationMouseOver = (uuid) => {
        // highlight annotation and comment
        this.commentbar.current.focusComment(uuid);
    }

    onAnnotationMouseOut = (uuid) => {
        // relax annotation and comment
        this.commentbar.current.unfocusComment(uuid);
    }

}
