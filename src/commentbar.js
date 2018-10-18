import React from 'react';

import Comment from './comment';

export default class CommentBar extends React.Component {

    constructor(props) {
        super(props);
        this.commentOffsets = {}
        this.commentIsOrphan = {}
        this.commentContainer = React.createRef();
    }

    setCommentOffset(uuid, offset, isOrphan) {
        this.commentOffsets[uuid] = offset;
        this.commentIsOrphan[uuid] = isOrphan;
    }

    renderOffsets() {
        let elements = [...this.commentContainer.current.children];

        let orphanCount = 0;

        elements.forEach(el => {
            if (this.commentOffsets.hasOwnProperty(el.dataset['commentId'])) {
                el.dataset['yOffset'] = this.commentOffsets[el.dataset['commentId']];
                el.dataset['isOrphan'] = this.commentIsOrphan[el.dataset['commentId']];
                if (el.dataset.isOrphan === 'true') {
                    orphanCount = orphanCount + 1;
                }
            }
        })

        // sort comments
        elements = elements.sort((a,b) => {
            if (a.className == 'adnotatio-commentbar-orphan') {
                if (b.dataset.isOrphan == 'true') {
                    return 1;
                } else {
                    return -1;
                }
            } else if (b.className == 'adnotatio-commentbar-orphan') {
                if (a.dataset.isOrphan == 'true') {
                    return 1;
                } else {
                    return -1;
                }
            }

            if (a.dataset.isOrphan == 'true') {
                return 1;
            } else if (b.dataset.isOrphan == 'true') {
                return -1;
            }

            if (parseFloat(a.dataset.yOffset) < parseFloat(b.dataset.yOffset)) {
                return -1;
            } else if (parseFloat(a.dataset.yOffset) > parseFloat(b.dataset.yOffset)) {
                return 1;
            } else {
                return 0;
            }
        })

        console.log(
            elements
        )

        var bottom = 0;

        elements.forEach(el => {

            let y_offset = Math.max(bottom, el.dataset.yOffset || 0);
            el.style.top = y_offset + 'px';

            if (el.className == 'adnotatio-commentbar-orphanheader') {
                if (orphanCount > 0) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            } else {
                if (el.dataset.isOrphan == 'true') el.className = 'adnotatio-commentbar-comment adnotatio-commentbar-orphan'
                else el.className = 'adnotatio-commentbar-comment'
            }

            bottom = y_offset + el.offsetHeight;
            bottom += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
            bottom += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
        })
    }

    handleReply = (e) => {
        let comment = new Comment(prompt("Please enter your reply: "), 'Anonymous');
        console.log(e.currentTarget.dataset.commentId, comment.text)
        if (!comment.text) {
            return;
        }
        console.log(e.currentTarget.dataset.commentId, comment)
        this.props.replyCallback(e.currentTarget.dataset.commentId, comment)
    }

    render() {
        console.log(this.props.comments)
        return <div className="adnotatio-commentbar" ref={this.commentContainer}>
            {this.props.comments.map(comment => {
                return <div className="adnotatio-commentbar-comment"
                        data-comment-id={comment.uuid} data-y-offset={comment.y_offset} className={'adnotatio-commentbar-comment' + (comment.isOrphan ? ' adnotatio-commentbar-orphan': '')}
                        onClick={this.handleReply}>
                    <span className='adnotatio-commentbar-comment-author'>{comment.author || 'Anonymous'}</span>
                    <span className='adnotatio-commentbar-comment-highlighted'>{comment.annotations[0].highlighted_text}</span>
                    <span className='adnotatio-commentbar-comment-text'>{comment.text}</span>
                    <div className='adnotatio-commentbar-comment-replies'>
                        {comment.replies.map(reply => {
                            return <div className='adnotatio-commentbar-comment-reply'>
                                <span className='adnotatio-commentbar-comment-author'>{reply.author || 'Anonymous'}</span>
                                <span className='adnotatio-commentbar-comment-text'>{reply.text}</span>
                            </div>
                        })}
                    </div>
                </div>
            })}
            <span className='adnotatio-commentbar-orphanheader' key='orphanTitle'>Orphans</span>
        </div>
    }
}
