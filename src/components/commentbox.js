import React from 'react';
import PropTypes from 'prop-types';
import TextArea from 'react-textarea-autosize';
const KaTeX = require('katex');
import Comment from '../comment';
import CommentHeader from './commentheader';
import Underscore from 'underscore';


export default class CommentBox extends React.Component {

    static propTypes = {
        comment: PropTypes.object,
        onClick: PropTypes.func,
        onMouseOver: PropTypes.func,
        onMouseOut: PropTypes.func,
        onHeightChange: PropTypes.func,
        onChange: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.state = {comment: this.props.comment.copy(), edit: this.props.comment.isDraft};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            comment: nextProps.comment.copy(),
            edit: nextProps.comment.isDraft
        });
    }

    renderCommentString = (comment) => {
        return Underscore.escape(comment).replace(/(?:\$\$(.*?)\$\$)|(?:\\\[(.*?)\\\])|(?:\$(.*?)\$)|(?:\\\((.*?)\\\))/g, function(outer, inner1, inner2, inner3, inner4, offset, string) {
            let displayMode = !!(inner1 || inner2);
            let inner = Underscore.unescape(inner1 || inner2 || inner3 || inner4);

            try {
                return KaTeX.renderToString(inner, { displayMode: displayMode });
            } catch (e) {
                if (e instanceof KaTeX.ParseError) {
                    console.log(e);
                    return "<span class='adnotatio-commentbar-latex-error' title='" + Underscore.escape(e.toString()) + "'>" + Underscore.escape(inner) + "</span>";
                } else {
                    throw e;
                }
            }
        });
    }

    onSave = () => {
        this.props.onChange('update', this.state.comment);
    }

    onDiscard = () => {
        if (this.state.comment.isDraft) {
            this.props.onChange('discard', this.state.comment);
        } else {
            this.setState({
                comment: this.props.comment.copy(),
                edit: false
            })
        }
    }

    onResolve = () => {
        this.state.comment.isResolved = true;
        this.props.onChange('update', this.state.comment);
    }

    componentDidUpdate() {
        this.props.onHeightChange();
    }

    render() {
        let comment = this.state.comment;
        return (
            <div
                data-comment-id={comment.uuid}
                data-y-offset={comment.y_offset}
                className={comment.replyTo ? 'adnotatio-commentbar-comment-reply' : ('adnotatio-commentbar-comment' + (comment.isOrphan ? ' adnotatio-commentbar-orphan': ''))}
                // onClick={this.props.onClick}
                onMouseOver={this.props.onMouseOver}
                onMouseOut={this.props.onMouseOut}
            >
                <CommentHeader comment={comment} actionMain="Resolve" actionMainCallback={() => this.onResolve()}/>
                {comment.annotations.length > 0 &&
                    <span className='adnotatio-commentbar-comment-highlighted'>{comment.annotations[0].highlighted_text}</span>
                }
                {this.state.edit ?
                    <>
                        <TextArea autoFocus useCacheForDOMMeasurements onHeightChange={this.props.onHeightChange} onChange={(e) => {comment.text = e.target.value}}
                        defaultValue={comment.text} onKeyDown={(e) => {if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {comment.text = e.target.value; this.onSave()}}}/>
                        <button className="adnotation-commentbar-comment-save" onClick={this.onSave}>Save</button><button className="adnotation-commentbar-comment-discard" onClick={this.onDiscard}>Cancel</button>
                    </>
                    :
                    <span className='adnotatio-commentbar-comment-text' dangerouslySetInnerHTML={{__html: this.renderCommentString(comment.text)}} onClick={() => {this.setState({edit: true})}}/>
                }
                <div className='adnotatio-commentbar-comment-replies'>
                    {comment.replies.map(reply => {
                        return <CommentBox key={reply.uuid} comment={reply} onChange={this.props.onChange} onHeightChange={this.props.onHeightChange} />
                    })}
                    {this.props.onCommentReply &&
                        <button className='adnotatio-commentbar-comment-reply-button' onClick={() => this.props.onCommentReply(comment.uuid)}>Reply</button>
                    }
                </div>

            </div>
        )
    }

}
