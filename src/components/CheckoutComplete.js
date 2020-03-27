import React, { useEffect, useState } from 'react';
import { Segment, Header, Image, Icon, Container, Divider, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import img from '../img/checkout-complete-img.JPG'

//component Import
import CheckoutItems from './CheckoutItems'


const CheckoutComplete = (props) => {

    const receipt = JSON.parse(localStorage.getItem('receipt'))
    const [customerReceipt, setCustomerReceipt] = useState(receipt)

    useEffect(() => {
        props.setCheckout(true)
    }, [])

    console.log(customerReceipt, 'receipt object - parsed') 

    const removeReceipt = () => {
        localStorage.removeItem('receipt')
    }

    return (
        <>
            <Segment className='order-complete'>
                <div>
                    <h1>Your order <span>{customerReceipt.customer_reference}</span> is complete!</h1>
                    {/* <Icon name='check circle outline' size='big' color='green' /> */}
                    <p>
                        Thanks for shopping at Seities Apparel - we sent an email to <span>{customerReceipt.customer.email}</span> with your full receipt. Please check spam if the email has not arrived within 5 minutes. 
                    </p>
                    <Divider className='divide'/>
                    <section>
                        {customerReceipt.order.line_items.map(item => (
                            <Container className='item-data-container' key={item.id}>
                                <CheckoutItems item={item}/>
                            </Container>
                        ))}
                    </section>
                    <Header size='small'>Shipping: {customerReceipt.order.shipping.price.formatted_with_symbol}</Header> 
                    <Header>Total: {customerReceipt.order.total.formatted_with_symbol}</Header> 
                    <Divider className='divide' horizontal>Shipping To</Divider>       
                    <Segment>
                        {customerReceipt.shipping.name}  <br />
                        {customerReceipt.shipping.street}  <br />
                        {customerReceipt.shipping.street_2 && (
                            <>
                            customerReceipt.shipping.street_2
                            <br />
                            </>
                        )}  
                        {customerReceipt.shipping.town_city}, {customerReceipt.shipping.county_state} {customerReceipt.shipping.postal_zip_code}  <br />
                        {customerReceipt.shipping.country} 
                    </Segment>
                    <Link to='/'>
                        <Button secondary size='large' onClick={removeReceipt}>Shop Again</Button>
                    </Link>
                </div>
                <Image src={img} size='medium' />
            </Segment>
        </>
    );
};

export default CheckoutComplete;