import React from 'react';
import Comment from '../comment';
import CommentBox from './commentbox';


export default class CommentBar extends React.Component {

    constructor(props) {
        super(props);
        this.commentAttributes = {}
        this.commentContainer = React.createRef();

        let comment = this.props.comments.find((comment) => comment.isDraft);
        this.state = {activeComment: comment ? comment.uuid : null};
    }

    setCommentAttributes(uuid, offset, isOrphan) {
        this.commentAttributes[uuid] = {
            offset: offset,
            isOrphan: isOrphan
        }
    }

    activateComment = (uuid) => {
        this.setState({activeComment: uuid});
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

    renderOffsets = () => {
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

        let referenceIndex = Math.max(
            0,
            this.state.activeComment
            ? elements.findIndex(element => {return element.dataset.commentId === this.state.activeComment})
            : 0
        );

        let aboveReference = elements.slice(0, referenceIndex);
        let belowReference = elements.slice(referenceIndex);
        let minAboveOffset = Infinity;
        let minBelowOffset = 0;

        let elementHeight = (el) => {
            return (
                el.offsetHeight
                + parseFloat(window.getComputedStyle(el).getPropertyValue('margin-top'))
                + parseFloat(window.getComputedStyle(el).getPropertyValue('margin-bottom'))
            )
        };

        // Elements above reference index need to be computed in reverse order
        elements.slice(0, referenceIndex+1).reverse().forEach(el => {
            let height = elementHeight(el);
            let y_offset = Math.min(minAboveOffset - height, (el.dataset.yOffset || 0));
            el.style.top = y_offset + 'px';

            minAboveOffset = y_offset;
        })

        elements.slice(referenceIndex).forEach(el => {

            let y_offset = Math.max(minBelowOffset, el.dataset.yOffset || 0);
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

            minBelowOffset = y_offset + el.offsetHeight;
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
        })
    }

    render() {
        return <div className="adnotatio-commentbar" ref={this.commentContainer}>
            {this.props.comments.map(comment => {
                return <CommentBox
                        isActive={comment.uuid === this.state.activeComment || comment.isDraft}
                        key={comment.uuid}
                        comment={comment}
                        onActivate={() => {this.activateComment(comment.uuid)}}
                        onCommentReply={() => {this.props.onCommentReply(comment.uuid)}}
                        onMouseOver={() => {this.props.focusAnnotations(comment.uuid)}}
                        onMouseOut={() => {this.props.unfocusAnnotations(comment.uuid)}}
                        onHeightChange={(height, instance) => {this.renderOffsets()}}
                        onChange={this.props.onCommentChange} />
            })}
            <span className='adnotatio-commentbar-orphanheader' key='orphanTitle'>Orphans</span>
        </div>
    }
}
