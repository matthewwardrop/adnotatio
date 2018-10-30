import React from 'react';
require("date-format-lite");

import {greedyHandler} from '../utils/handlers';

export default class CommentHeader extends React.PureComponent {

    renderDateString(date) {
        return new Date(date).format('D MMM YYYY, HH:mm');
    }

    render() {
        let comment = this.props.comment;
        return <>
            <div className='adnotatio-commentbar-comment-header'>
                <span className='adnotatio-commentbar-comment-header-avatar' style={{backgroundImage: 'url('+comment.authorAvatar+')'}} />
                <span className='adnotatio-commentbar-comment-metadata'>
                    <span className='adnotatio-commentbar-comment-author'>
                        {comment.authorEmail
                            ? <a href={"mailto://" + comment.authorEmail}>{comment.authorName || 'Anonymous'}</a>
                            : <>{comment.authorName || 'Anonymous'}</>
                        }
                    </span>
                    <span className='adnotatio-commentbar-comment-date'>
                        {this.renderDateString(comment.tsCreated)}
                    </span>
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
