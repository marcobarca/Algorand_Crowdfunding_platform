import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Col, Row } from 'react-bootstrap';
import { getUnsignedTxn, postSignedTxn } from '../APIs/API';
import { signTransaction } from '../Utils/AlgoSignerOperations';

function ProjectForm() {

    const handleSubmit = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault()

        // Get data from the form.
        const data = {
            creator: event.target.creator.value,
            goal: event.target.goal.value,
            start: event.target.duration.value,
        }
        try {

            await getUnsignedTxn("R3Z6A6BUXWRYZ3IFBSK7Y54EBN6FRBSYGS4GNTNE2DB5GXJAC64JOMNFNI", data.goal, data.start).then(
                (txn) => {
                    signTransaction(txn).then(
                        (binary_signed_txn) => {
                            console.log("Signed. Sending through post")
                            postSignedTxn(binary_signed_txn)
                        }
                    )
                }
            )

            // let txn = await getUnsignedTxn("R3Z6A6BUXWRYZ3IFBSK7Y54EBN6FRBSYGS4GNTNE2DB5GXJAC64JOMNFNI", data.goal, data.start)

            // let binary_signed_txn = signTransaction(txn)

            // let response = await postSignedTxn(binary_signed_txn);
            // console.log(response)

            

        } catch (err) {
            console.log(err)
        }

    }



    return (
        <Form onSubmit={handleSubmit}>
            <Row />
            <Row>
                <Col />
                <Col>
                    <Form.Group className="mb-2" controlId="creator">
                        <Form.Control placeholder="Enter creator" />
                    </Form.Group>

                    <Form.Group className="mb-2" controlId="goal">
                        <Form.Control placeholder="Enter goal" />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="duration">
                        <Form.Control placeholder="Duration" />
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