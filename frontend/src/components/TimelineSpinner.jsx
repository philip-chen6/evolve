import Spinner from 'react-bootstrap/Spinner';
import './TimelineSpinner.css';

function TimelineSpinner() {
  return (
    <div className="spinner-container">
      <Spinner animation="grow" variant="dark" />
    </div>
  );
}

export default TimelineSpinner;
