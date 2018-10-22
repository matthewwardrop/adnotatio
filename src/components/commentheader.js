import React from 'react';

import {greedyHandler} from '../utils.js';

export default class CommentHeader extends React.PureComponent {

    render() {
        let comment = this.props.comment;
        return <>
            <div className='adnotatio-commentbar-comment-header'>
                <span className='adnotatio-commentbar-comment-header-avatar' />
                <span className='adnotatio-commentbar-comment-author'>
                    {comment.authorEmail
                        ? <a href={"mailto://" + comment.authorEmail}>{comment.authorName || 'Anonymous'}</a>
                        : <>{comment.authorName || 'Anonymous'}</>
                    }<br/>
                    {new Date(comment.tsCreated).toLocaleString()}
                </span>
                {!comment.replyTo &&
                    <button className='adnotatio-commentbar-comment-resolve'
                        onClick={greedyHandler(this.props.actionMainCallback)}>
                        {this.props.actionMain}
                    </button>
                }
            </div>

        </>
    }

}
