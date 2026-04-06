import { useState } from 'react';

const STAR_OPTIONS = [1, 2, 3, 4, 5];

function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submittedRating, setSubmittedRating] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedFeedback = feedback.trim();

    if (!rating) {
      setError('Please choose a star rating before submitting.');
      return;
    }

    if (!trimmedFeedback) {
      setError('Please share a few words of feedback before submitting.');
      return;
    }

    setError('');
    setSubmittedRating(rating);
    setFeedback('');
    setRating(0);
  };

  const handleSelectRating = (nextRating) => {
    setRating(nextRating);
    setError('');
  };

  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Feedback</h2>
        <p>
          Share a quick rating and tell us what is working well or what could be
          improved next.
        </p>
      </div>

      <form className="expense-form feedback-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <h2>Rate Your Experience</h2>
          <p>Your feedback helps shape the next improvements to the tracker.</p>
        </div>

        <div className="feedback-rating-panel">
          <span className="feedback-label">Star Rating</span>
          <div aria-label="Star rating" className="feedback-star-group" role="group">
            {STAR_OPTIONS.map((value) => {
              const isActive = value <= rating;

              return (
                <button
                  key={value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={rating === value}
                  className={
                    isActive
                      ? 'feedback-star-button feedback-star-button-active'
                      : 'feedback-star-button'
                  }
                  type="button"
                  onClick={() => handleSelectRating(value)}
                >
                  {'\u2605'}
                </button>
              );
            })}
          </div>
          <p className="feedback-rating-copy">
            {rating > 0
              ? `${rating} out of 5 stars selected`
              : 'Choose a rating from 1 to 5 stars.'}
          </p>
        </div>

        <label className="form-field feedback-field" htmlFor="feedback-message">
          <span>Your Feedback</span>
          <textarea
            id="feedback-message"
            className="feedback-textarea"
            placeholder="Tell us what you like or what we should improve."
            rows="5"
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setError('');
            }}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        {submittedRating ? (
          <div className="feedback-success" role="status">
            <strong>Thanks for the feedback.</strong>
            <p>Your {submittedRating}-star response was received successfully.</p>
          </div>
        ) : null}

        <div className="form-actions">
          <button className="primary-button" type="submit">
            Submit Feedback
          </button>
        </div>
      </form>
    </section>
  );
}

export default FeedbackPage;