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
            if (a.className == 'orphanTitle') {
                if (b.dataset.isOrphan == 'true') {
                    return 1;
                } else {
                    return -1;
                }
            } else if (b.className == 'orphanTitle') {
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

            if (el.className == 'orphanTitle') {
                if (orphanCount > 0) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            } else {
                if (el.dataset.isOrphan == 'true') el.className = 'comment orphan'
                else el.className = 'comment'
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
        return <div className="CommentBar" ref={this.commentContainer}>
            {this.props.comments.map(comment => {
                return <div data-comment-id={comment.uuid} data-y-offset={comment.y_offset} className={'comment' + (comment.isOrphan ? ' orphan': '')}
                        onClick={this.handleReply}>
                    <span className='author'>{comment.author || 'Anonymous'}</span>
                    <span className='highlighted'>{comment.annotations[0].highlighted_text}</span>
                    <span className='text'>{comment.text}</span>
                    <div className='replies'>
                        {comment.replies.map(reply => {
                            return <div className='reply'>
                                <span className='author'>{reply.author || 'Anonymous'}</span>
                                <span className='text'>{reply.text}</span>
                            </div>
                        })}
                    </div>
                </div>
            })}
            <span className='orphanTitle' key='orphanTitle'>Orphans</span>
        </div>
    }
}
