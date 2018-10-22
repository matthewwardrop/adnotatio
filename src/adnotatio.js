'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import LocalCommentStorage from './storage/local';
import CommentBar from './components/commentbar'
import TextAnnotation from './annotations/text';
import Comment from './comment';
import {getViewportOffset} from './utils';
import './base.less';

module.exports = Adnotatio;

export default class Adnotatio extends React.Component {

    static propTypes = {
        authority: PropTypes.string,
        documentId: PropTypes.string,
        documentVersion: PropTypes.string,
        documentMetadata: PropTypes.object,
        useKaTeX: PropTypes.bool
    }

    constructor(props) {
        super(props);

        // DOM references
        this.wrapper = React.createRef();
        this.document = React.createRef();
        this.bglayer = React.createRef();
        this.fglayer = React.createRef();
        this.commentbar = React.createRef();
        this.commentButton = React.createRef();

        this.storage = new LocalCommentStorage(
            this.props.authority, this.props.documentId,
            this.props.documentVersion, this.props.documentMetadata
        );

        this.state = {'comments': []}
    }

    // Component lifecycle methods

    componentDidMount() {
      window.addEventListener('resize', this.onWindowResize);
      this.storage.connect(this.onCommentsUpdate);
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
                    <button className="adnotatio-comment-button" ref={this.commentButton} onClick={this.onCommentCreate} style={{display: "none"}}>🗩</button>
                    <div className="adnotatio-document-bg" ref={this.bglayer} />
                    <div className="adnotatio-document-main" ref={this.document} onMouseUp={this.onDocumentMouseUp}>
                        {this.props.children}
                    </div>
                    <div className="adnotatio-document-fg" ref={this.fglayer} />
                </div>
                {this.state.comments.length > 0 &&
                    <>
                    <CommentBar comments={this.state.comments} onCommentChange={this.onCommentChange} onCommentReply={this.onCommentReply} focusAnnotations={this.focusAnnotations} unfocusAnnotations={this.unfocusAnnotations} ref={this.commentbar} />
                    <button onClick={() => {window.localStorage.clear(); this.storage.comments=[]; this.setState({comments: []})}}><span style={{display: 'inline-block', transform: 'rotate(90deg)', transformOrigin: 'center center', whiteSpace: 'pre', width: '1em', textAlign: 'center'}}>Clear All Comments</span></button>
                    </>
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

        let comment = new Comment("", 'Anonymous');
        comment.isDraft = true;

        for (let i = 0; i < selection.rangeCount; i++) {
            let range = selection.getRangeAt(i);
            comment.addAnnotation(TextAnnotation.fromRange(range, this.document.current));
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

        let reply = new Comment({replyTo: host_uuid});
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
