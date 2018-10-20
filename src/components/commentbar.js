import React from 'react';
import Comment from '../comment';
import CommentBox from './commentbox'

import 'katex/dist/katex.min.css';


export default class CommentBar extends React.Component {

    constructor(props) {
        super(props);
        this.commentAttributes = {}
        this.commentContainer = React.createRef();
    }

    setCommentAttributes(uuid, offset, isOrphan) {
        this.commentAttributes[uuid] = {
            offset: offset,
            isOrphan: isOrphan
        }
    }

    focusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "true";
        })
    }

    unfocusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "false";
        })
    }

    renderOffsets() {
        let elements = [...this.commentContainer.current.children];

        let orphanCount = 0;

        elements.forEach(el => {
            if (this.commentAttributes.hasOwnProperty(el.dataset['commentId'])) {
                el.dataset['yOffset'] = this.commentAttributes[el.dataset['commentId']].offset;
                el.dataset['isOrphan'] = this.commentAttributes[el.dataset['commentId']].isOrphan;
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
        this.props.onCommentReply(e.currentTarget.dataset.commentId)
    }

    onResolve = (e) => {
        alert('resolving!')
    }

    render() {
        return <div className="adnotatio-commentbar" ref={this.commentContainer}>
            {this.props.comments.map(comment => {
                return <CommentBox
                        key={comment.uuid}
                        comment={comment}
                        onClick={this.handleReply}
                        onCommentReply={this.props.onCommentReply}
                        onMouseOver={() => {this.props.focusAnnotations(comment.uuid)}}
                        onMouseOut={() => {this.props.unfocusAnnotations(comment.uuid)}}
                        onHeightChange={(height, instance) => {this.renderOffsets()}}
                        onChange={this.props.onCommentChange} />
            })}
            <span className='adnotatio-commentbar-orphanheader' key='orphanTitle'>Orphans</span>
        </div>
    }
}
