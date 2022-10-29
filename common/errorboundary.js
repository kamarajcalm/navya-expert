
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.log('inside static getDerivedStateFromError : errorMessage : ',error);
    const errorMessage = error.message || error.code || false;
    console.log('getDerivedStateFromError errorMessage : ',errorMessage);
    if (errorMessage) {
      errorMessage.toLowerCase().indexOf('chunk') > -1 && window.location.reload();
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log('inside componentDidCatch');
    console.log('error : ',error);
    console.log('error : ',errorInfo);
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1 style={{'display': 'none'}}>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
