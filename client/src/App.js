import './App.css';
import ProjectForm from './Components/ProjectForm';
import ConnectButton from './Components/ConnectButton';
import MyNavbar from './Components/MyNavbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Button, Row } from 'react-bootstrap';


function App() {

  return (
    <div className="App">
      
      <MyNavbar/>
      <Row>
        <ProjectForm/>
      </Row>

    </div>
  );
}

export default App;
