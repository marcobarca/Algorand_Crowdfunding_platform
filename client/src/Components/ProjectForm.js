import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Col, Row } from 'react-bootstrap';
import { getUnsignedTxn, postSignedTxn } from '../APIs/API';
import { signTransaction } from '../Utils/AlgoSignerOperations';
import { Icon } from '@iconify/react';

function ProjectForm() {

    const handleSubmit = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault()

        // Get data from the form.
        const data = {
            creator: event.target.creator.value,
            goal: event.target.goal.value,
            startDate: event.target.startDate.value,
            endDate: event.target.endDate.value,
            chain: event.target.chain.value,
        }

        switch (data.chain) {
            case "Algorand":
                console.log("*** Starting deployng Algorand application ***");
                try {
                    //FIXME : adding real creator address
                    await getUnsignedTxn("R3Z6A6BUXWRYZ3IFBSK7Y54EBN6FRBSYGS4GNTNE2DB5GXJAC64JOMNFNI", data.goal, data.startDate, data.endDate
                    ).then(
                        (txn) => {
                            signTransaction(txn["txnBody"]
                            ).then(
                                (binary_signed_txn) => {
                                    console.log("Sending signed txn to the server. (Waiting for deployment...)")
                                    postSignedTxn(txn["txnID"], binary_signed_txn).then(
                                        (result) => {
                                            console.log(result)
                                        }
                                    )
                                }
                            )
                        }
                    )
                } catch (err) {
                    console.log(err);
                }
                break;
            case "Ethereum":
                console.log("Blockchain not supported yet.")
                break;
            case "Solana":
                console.log("Blockchain not supported yet.")
                break;
            case "Cardano":
                console.log("Blockchain not supported yet.")
                break;

        }

    }



    return (
        <Form onSubmit={handleSubmit}>
            <Row />
            <Row>
                <Col />
                <Col>
                    <Form.Label>Creator</Form.Label>
                    <Form.Group className="mb-2" controlId="creator">
                        <Form.Control placeholder="Enter creator" />
                    </Form.Group>

                    <Form.Label>Goal</Form.Label>
                    <Form.Group className="mb-2" controlId="goal">
                        <Form.Control placeholder="Enter goal" />
                    </Form.Group>

                    <Form.Label>Start Date</Form.Label>
                    <Form.Group className="mb-3" controlId="startDate">
                        <Form.Control type="datetime-local" placeholder="Start Date" name='startDate' />
                    </Form.Group>

                    <Form.Label>End Date</Form.Label>
                    <Form.Group className="mb-3" controlId="endDate">
                        <Form.Control type="datetime-local" placeholder="End Date" name='endDate' />
                    </Form.Group>

                    <Form.Label>Chain</Form.Label>

                    <Form.Group className="mb-3" controlId="chain">
                        <Form.Select>
                            <option>Select blockchain</option>
                            <option value="Algorand">Algorand</option>
                            <option value="Ethereum">Ethereum</option>
                            <option value="Solana">Solana</option>
                            <option value="Cardano">Cardano</option>
                        </Form.Select>
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit">
                        Submit
                    </Button>
                </Col>
                <Col />
            </Row>
            <Row />
        </Form>
    );
}

export default ProjectForm;