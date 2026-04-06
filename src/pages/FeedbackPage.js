import { useState } from 'react';

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const FEEDBACK_STORAGE_KEY = 'expense-tracker-feedback';

const createFeedbackEntry = (rating, feedback) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  rating,
  feedback,
  submittedAt: new Date().toISOString(),
});

function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submittedRating, setSubmittedRating] = useState(null);

  const activeRating = hoveredRating || rating;
  const ratingMessage = hoveredRating
    ? `Previewing ${hoveredRating} out of 5 stars`
    : rating > 0
      ? `${rating} out of 5 stars selected`
      : 'Choose a rating from 1 to 5 stars.';

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

    try {
      const existingFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const parsedFeedback = existingFeedback ? JSON.parse(existingFeedback) : [];
      const nextFeedback = Array.isArray(parsedFeedback) ? parsedFeedback : [];

      nextFeedback.push(createFeedbackEntry(rating, trimmedFeedback));
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(nextFeedback));
    } catch (storageError) {
      console.error('Failed to save feedback to localStorage.', storageError);
      setError('Unable to save your feedback right now. Please try again.');
      return;
    }

    setError('');
    setSubmittedRating(rating);
    setFeedback('');
    setHoveredRating(0);
    setRating(0);
  };

  const handleSelectRating = (nextRating) => {
    setRating(nextRating);
    setHoveredRating(0);
    setSubmittedRating(null);
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
          <div
            aria-describedby="feedback-rating-copy"
            aria-label="Star rating"
            className="feedback-star-group"
            role="group"
            onMouseLeave={() => setHoveredRating(0)}
          >
            {STAR_OPTIONS.map((value) => {
              const isHighlighted = value <= activeRating;
              const isSelected = value <= rating;
              const isPreviewing = hoveredRating > 0 && value <= hoveredRating;
              const className = [
                'feedback-star-button',
                isHighlighted ? 'feedback-star-button-highlighted' : '',
                isSelected ? 'feedback-star-button-selected' : '',
                isPreviewing ? 'feedback-star-button-preview' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={rating === value}
                  className={className}
                  type="button"
                  onBlur={() => setHoveredRating(0)}
                  onClick={() => handleSelectRating(value)}
                  onFocus={() => setHoveredRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                >
                  {'\u2605'}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="feedback-rating-copy" id="feedback-rating-copy">
            {ratingMessage}
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
              setSubmittedRating(null);
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