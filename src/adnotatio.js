'use strict';

import React from 'react';
import CommentStorage from './storage';
import CommentBar from './commentbar'
import TextAnnotation from './annotations/text';
import Comment from './comment';
import './base.less';

module.exports = Adnotatio;

export default class Adnotatio extends React.Component {

    constructor(props) {
        super(props);

        this.wrapper = React.createRef();
        this.document = React.createRef();
        this.commentbar = React.createRef();

        this.bglayer = React.createRef();
        this.fglayer = React.createRef();

        this.commentButton = React.createRef();

        this.state = {'comments': []}

        this.storage = new CommentStorage();
    }

    updateCommentsHook = (comments) => {
        this.setState({'comments': comments})
    }

    onResize = () => {
        this.forceUpdate();
    }

    // Component lifecycle methods

    componentDidMount() {
      window.addEventListener('resize', this.onResize);
      this.storage.connect(this.updateCommentsHook);
      this.componentDidUpdate();
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
        window.removeEventListener('resize', this.onResize);
        this.storage.disconnect();
    }

    handleMouseUp = (e) => {
        if (window.getSelection().isCollapsed) {
            this.commentButton.current.style.display = "none";
        } else {
            this.currentSelection = window.getSelection();
            this.commentButton.current.style.display = 'block';
            // this.commentButton.current.style.right = "-100%";
            this.commentButton.current.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) + window.getSelection().getRangeAt(0).getClientRects()[0].y - this.wrapper.current.offsetTop) + 'px';
        }
    }

    renderAnnotations = () => {
        if (this.state.comments.length === 0) return;
        this.state.comments.forEach((comment) => {
            comment.annotations.forEach((annotation) => {
                console.log(annotation);
                annotation.render(
                    this.document.current, this.bglayer.current, this.fglayer.current
                );
            })
            this.renderCommentBox(comment);
        })

        this.commentbar.current.renderOffsets();
    }

    renderCommentBox = (el) => {
        let annotation = el.annotations[0];
        let range = annotation.toRange(this.document.current);
        let isOrphan = range ? false : true;
        let y_offset = 0;
        if (!isOrphan) {
            y_offset = ((document.documentElement.scrollTop || document.body.scrollTop) + range.getClientRects()[0].y - getOffset(this.wrapper.current).top);
        }

        return this.commentbar.current.setCommentOffset(el.uuid, y_offset, isOrphan);
    }

    makeAnnotation = (e) => {
        let selection = window.getSelection();
        if (selection.toString() === "") {
            return;
        }

        let comment = new Comment(prompt("Please enter your comment: "), 'Anonymous');
        if (!comment.text) {
            return;
        }

        for (let i = 0; i < selection.rangeCount; i++) {
            let range = selection.getRangeAt(i);
            comment.addAnnotation(TextAnnotation.fromRange(range, this.document.current));
        }

        this.storage.submit(comment);

        this.commentButton.current.style.display = "none";
        window.getSelection().empty()
    }

    replyCallback = (host_uuid, reply) => {
        let hostComment = this.storage.get_comment(host_uuid);

        if (!hostComment) {
            throw "Invalid comment: " + e.target.dataset.commentId
        }

        hostComment.addReply(reply);

        this.storage.submit(hostComment);
    }

    render() {
        return (
            <div className='adnotatio-wrapper'>
                <div className='adnotatio-document-wrapper' ref={this.wrapper}>
                    <button className="adnotatio-comment-button" ref={this.commentButton} onClick={this.makeAnnotation}>🗩</button>
                    <div className="adnotatio-document-bg" ref={this.bglayer} />
                    <div className="adnotatio-document-main" ref={this.document} onMouseUp={this.handleMouseUp}>
                        {this.props.children}
                    </div>
                    <div className="adnotatio-document-fg" ref={this.fglayer} />
                </div>
                {this.state.comments.length > 0 &&
                    <>
                    <CommentBar comments={this.state.comments} replyCallback={this.replyCallback} ref={this.commentbar} />
                    <button onClick={() => {window.localStorage.clear(); this.storage.comments=[]; this.setState({comments: []})}}><span style={{display: 'inline-block', transform: 'rotate(90deg)', transformOrigin: 'center center', whiteSpace: 'pre', width: '1em', textAlign: 'center'}}>Clear All Comments</span></button>
                    </>
                }


            </div>
        );
    }
}



function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  };
}
