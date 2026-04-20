import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary" role="alert">
                    <div className="error-boundary-icon">⚠️</div>
                    <h3>{this.props.title || 'Something went wrong'}</h3>
                    <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
                    <button type="button" className="btn-secondary" onClick={this.handleRetry}>
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
