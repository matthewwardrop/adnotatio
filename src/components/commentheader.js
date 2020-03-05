import { faCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import Comment from '../comment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { greedyHandler } from '../utils/handlers';
import PropTypes from 'prop-types';
import React from 'react';
require('date-format-lite');

export default class CommentHeader extends React.PureComponent {

    static propTypes = {
        comment: PropTypes.instanceOf(Comment),

        actionMainCallback: PropTypes.func,
    }

    renderDateString(date) {
        return new Date(date).format('D MMM YYYY, hh:mm');
    }

    render() {
        const comment = this.props.comment;

        return <>
            <div className='adnotatio-commentbar-comment-header'>
                <span className='adnotatio-commentbar-comment-header-avatar'>
                    {comment.authorAvatar === null
                        ? <FontAwesomeIcon icon={faUser} />
                        : <img src={comment.authorAvatar} />
                    }
                </span>
                <span className='adnotatio-commentbar-comment-metadata'>
                    <span className='adnotatio-commentbar-comment-author'>
                        {comment.authorEmail
                            ? <a href={'mailto://' + comment.authorEmail}>{comment.authorName || 'Anonymous'}</a>
                            : <>{comment.authorName || 'Anonymous'}</>
                        }
                    </span>
                    <span className='adnotatio-commentbar-comment-date'>
                        {this.renderDateString(comment.tsCreated)}
                    </span>
                </span>
                {!comment.replyTo && !comment.isDraft &&
                    <button className='adnotatio-commentbar-comment-resolve'
                        onClick={greedyHandler(this.props.actionMainCallback)}
                        title='Resolve'>
                        <FontAwesomeIcon icon={faCheck} />
                    </button>
                }
            </div>
        </>;
    }

}
