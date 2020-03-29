# Creating a receipt and webhook notification with Commerce.js

This guide explains how to create a receipt page along with using webhooks provided by Commerce.js and the Chec Dashboard. 

[Live demo for this Guide: "***Creating a receipt and webhook notification***"](https://seities-store-cjs-react-guide.netlify.com/)

****** *Note* ******

* *This guide is using v2 of the SDK*
* *The Live Demo is best viewed on Desktop (**responsiveness limited**)*
* *This is a continuation of a previous guide - [Single page checkout](https://single-page-checkout-cjs.netlify.com/)*

**********

![](src/img/Guide-4/hero.JPG)

## Overview
After I capture a checkout and processed the payment, I now want to provide some confirmation of purchase to the customer.  Thankfully the Commerce.js SDK (post capture) provides all the data needed in order to curate a 'receipt' or conformation page.  I will be using that data to display to the customer some of the order details and shipping info.  Lastly I will incorporate webhooks provided by Commerce.js via the Chec Dashboard to help send a Slack notification that a new order has been placed! Let's get started ... 

#### This guide will cover: 

1. Saving receipt info to local storage
2. Retrieving receipt data for display
3. Add private route & removing data from local storage
4. Setup URL to receive webhook payload
5. Add webhook in Chec Dashboard
6. Send notification message to Slack channel

### Requirements/Prerequisites

- [ ] IDE of your choice (code editor)
- [ ] [NodeJS](https://nodejs.org/en/), or [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable) → npm or yarn.
- [ ] Some knowledge of Javascript & React
- [ ] Some knowledge of [webhooks](https://sendgrid.com/blog/whats-webhook/)
- [ ] *Bonus* - Using [React Hooks](https://reactjs.org/docs/hooks-reference.html) - specifically `useState()`
- [ ] *Bonus* - [React Router](https://reacttraining.com/react-router/web/api/Route)
- [ ] *Bonus* - [Node/Express](https://expressjs.com/)
- [ ] *Bonus* - [Slack API - webhooks](https://slack.com/help/articles/115005265063-Incoming-Webhooks-for-Slack)
- [ ] *Bonus* - familiarity with the framework [Semantic UI (react) library](https://react.semantic-ui.com/)

## Getting Started

### STEP 1. Saving Receipt Info to Local Storage:

The SDK used to provide a helper function you could pass the checkout token and get the receipt info - unfortunately that function is no longer live &#128532;.  This is because under the hood, the function hit an endpoint that required your secret key.  The SDK only utilizes helper functions with your public API key.  

No worries &#128515; - you can make use of the browser's local storage as a way to save data.  Let's take a look at the response from capturing a checkout:   

<p align="center">
  <img src="src/img/Guide-4/post-capture.JPG">
</p>

As you can see this entire response is essentially the cutomer receipt.  Inside the `then()` function connected to our `commerce.checkout.capture()` - I can save this data to [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): 

```javascript
// *** CheckoutForm.js ***
commerce.checkout.capture(props.tokenId, final)
    .then(res => {
            props.setReceipt(res)
            localStorage.removeItem('cart-id')
            localStorage.setItem('receipt', JSON.stringify(res))
            history.push(`/order-complete/${props.tokenId}/${res.id}`)
            setProcessing(false)
    })
```
*** *Note *** You must **[stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)** the response object when adding to local storage*

```
localStorage.setItem('receipt', JSON.stringify(res))
```

**A quick recap of what's happening post capture:** 
- `props.setReceipt(res)` triggers a call on the homepage to update cart info
- `localStorage.removeItem('cart-id')` removes cart-id for routing logic
- `localStorage.removeItem('cart-id')` ***new* - adding receipt data to local storage**
- ``history.push(`/order-complete/${props.tokenId}/${res.id}`)`` routing the customer to the conformation page
- `setProcessing(false)` logic trigger for displaying cart icon

#### Checking Local Storage for data

Now that I've added the data to local storage, let's check to make sure it is there.  Go to your browser and inspect your page.  The inspect window will have tabs and you should locate the **`Application`** tab.  From there you will see a **`Local Storage`** dropdown with a specific domain. Click the domain and you will see a list of all objects stored in local storage:

![](src/img/Guide-4/local-storage.JPG)

I can confirm local storage has the proper information with the key set to '`receipt`'.  It is important to note this data will always be stored in the browser until it is either manual deleted or removed in code (*I'll cover this later* &#129488;).  I can now access this data anywhere in my app! Let's see about retrieving ...

### Step 2. Retrieving Receipt Data for Display

Accessing the data in local storage is as straightforward as putting it in local storage.  You just use `localStorage.getItem()` and pass it a `key`: 

```javascript
// *** CheckoutComplete.js ***
const receipt = JSON.parse(localStorage.getItem('receipt'))
```

Just as you needed to **`stringify`** previsouly - you also must use [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) in order to get the data into a format needed to utilize the data.  You can log the '`receipt`' variable and you will see it's identical to the response we logged post capture.  

#### The `<CheckoutComplete />` component

It is time to update the `<CheckoutComplete />` component with all the useful data a customer would like to see after completing a purchase.  Now that you have a variable that contains everything, let's initialize state with the new data: 

```javascript
// *** CheckoutComplete.js ***

// Parsing local storage data
const receipt = JSON.parse(localStorage.getItem('receipt'))

// Initializing state with our local storage data
const [customerReceipt, setCustomerReceipt] = useState(receipt)
```

Once initialized, you can now use the state object to render whichever customer data you choose.  Again this portion is completely up to you, but here's an example of some of the data one can show: 

<p align="center">
  <img src="src/img/Guide-4/confirm-pg-zoomed.JPG">
</p>

```javascript
// *** CheckoutComplete.js ***
return (
<>
    <Segment className='order-complete'>
        <div>
            <h1>Your order <span>{customerReceipt.customer_reference}</span> is complete!</h1>
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
            <Header size='small'>
                Shipping: {customerReceipt.order.shipping.price.formatted_with_symbol}
            </Header> 
            <Header>
                Total: {customerReceipt.order.total.formatted_with_symbol}
            </Header> 
            <Divider className='divide' horizontal>Shipping To</Divider>       
            <Segment>
                {customerReceipt.shipping.name}  <br />
                {customerReceipt.shipping.street}  <br />
                {customerReceipt.shipping.street_2 && (
                    <>
                    {customerReceipt.shipping.street_2}
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
```

As you can see, this portion is all about taking the data given and displaying it however you see fit.  

### Step. 3 Add Private Route & Removing Data from Local Storage

I've completed the component that will display information for the customer - now what &#129335;!? I want this information displayed as long as the customer hasn't navigated away - either by pressing **back** or clicking **shop again** button.  

Once the customer navigates away, they should **NOT** be able to return and still render the receipt info.  

#### Private Route for the `<CheckoutComplete />` component

In order to achieve this I will setup a private route to the `<CheckoutComplete />` component that only renders if the '`receipt`' object is stored in local storage: 

```javascript
// *** PrivateRouteReceipt.js ***
const PrivateRoute = ({ component: Component, ...rest }) => {
	
	return <Route {...rest} render={(props) => {

		if(localStorage.getItem('receipt')) {
			return <Component {...props} {...rest}/>
		}
		
		else {
			return <Redirect to="/" />
		}

	}} />
}
```

This function checks to see if **'`receipt`'** exist in local storage - if `true`, the function will return the `<CheckoutComplete />` component; if `false` the customer will be redirected to home (`to="/"`). 

Let's add this private route to our `<CheckoutComplete />` component: 

```javascript
// *** App.js ***
<PrivateRouteReceipt 
    component={CheckoutComplete}
    path={`/order-complete/:checkoutToken/:orderId`}
    setCheckout={setCheckout} 
/>
```

#### Removing from local storage

The last step is to actually remove the data from local storage.  As mentioned, once the customer navigates from the page, they should not be able to navigate back again.  

One obvious place to remove data from local storage is when `shop again` button is clicked.  I created a function that does this: 

```
<Link to='/'>
    <Button secondary size='large' onClick={removeReceipt}>Shop Again</Button>
</Link>
```
```
const removeReceipt = () => {
    localStorage.removeItem('receipt')
}
```

Once clicked, `removeReceipt()` will delete the key **'`receipt`'** from local storage.  Because of the private route created, the customer will not be able to navigate back to the conformation page.  

Now - let's access what happens when a customer presses back.  The previous page is the checkout page which displays cart info and a form to capture a checkout.  I already have another private route setup to check if the **'`cart-id`'** key is in local storage - if `false` the customer will NOT be able to view the checkout page (***because that cart has already been emptied based on a successfully capture***) and will be routed home.

I now need to remove the **'`receipt`'** object (*from local storage*) whenever the `<ProductContainer />` component is loaded. Whenever the `<ProductContainer />` component is rendered (***which is essentially our home page***), there should **NEVER** be a **'`receipt`'** object in local storage.  I can simply add the removal in the `useEffect()` to always delete the desired key upon every render: 

```javascript
// *** ProductContainer.js ***
useEffect(() => {
    commerce.products.list()
        .then(res => {
        setProducts(res.data)
        })
        .catch(err => console.log(err))

        props.setCheckout(false)
        localStorage.removeItem('receipt') //Added to remove key from LS
},[])
```

These actions ensure the customer will **ONLY** have access to the receipt info **UNTIL** they navigate elsewhere.  Okie dokie! That pretty much sums up handling the receipt info along with proper navigation logic.  The next steps pertain to setting up and configuring webhooks &#128526;. 

*** ***Note** *** In order to proceed, you will need to have some knowledge about setting up a server along with handling http request.*

### Step 4. Setup URL to Receive Webhook Payload

Commerce.js has recently added webhook functionality within the Chec Dashboard.  This means as a developer you can select among many actions/events that when triggered will send specific data associated with that event to a specified URL.  Some actions include: 

- When a checkout capture occurs
- Whenever an order gets fulfilled
- Once a new product is created

<p align="center">
  <img src="src/img/Guide-4/webhook-events.JPG">
</p>

As you can see there are many different webhook events you can choose from.  This is very beneficial in that you don't have to ping an endpoint or use the SDK to see about certain data changes.  Once configured, your server will automatically get a notification (***a http post request***) whenever an event takes place.  In this example I will be configuring a webhook event for whenever an order is captured.  

#### Setting up your endpoint

As mentioned previously, you can setup your server using the technology of your choice - I choose to setup a popup server using Node.js:

```javascript
// *** index.js ***
const server = require('./server.js');

const PORT = process.env.PORT || 7500;

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
```

Further, once my server is setup, I will using express to handle **`http`** requests.  For the purposes of this example, we only need to create one endpoint that accepts a **`POST`** request: 

```javascript
// *** server.js ***
server.post('/new-order', (req, res) => {

    // Just logging the body of the request
    console.log(req.body, 'data from webhook call')

    // Sending a 200 to show success
    res.status(200).json({message: "success"})
        
})
```
For the moment, this is all that needs to be done.  In the next step I will configure the webhook in the Chec Dashboard with the newly created URL - **`myserver.com/new-order`**

### Step 5. Add Webhook in Chec Dashboard

Now that my endpoint is setup and I'm logging the body (*in order to see what's coming through*), I need to add that URL and configure the webhook from the Chec Dashboard.  Navigate to `Setup` and click the `Webhooks` tab.  Once you're in the `webhooks` menu, click **`+ ADD WEBHOOK`** button: 

<p align="center">
  <img src="src/img/Guide-4/add-webhook-info.JPG">
</p>

Finish the process by clicking **`Add webhook`**.  Let's start off by sending a test to my server endpoint.  If you recall we're logging the body so if the test runs successfully, I can see the webhook payload (*a fancy word for data*). Under options click `View details`:

<p align="center">
  <img src="src/img/Guide-4/webhook-view-details.JPG">
</p>

You will see a button that says **`SEND TEST REQUEST`**.  If configured properly you will see some data logged on your server: 

<p align="center">
  <img src="src/img/Guide-4/test-payload.JPG">
</p>

Because I sent back a *200* status code a green check mark will display if successful: 

<p align="center">
  <img src="src/img/Guide-4/test-status-200.JPG">
</p>

#### Capture an Order! 

Remember, the ultimate goal is take some data that is sent to our server (***whenever the webhook event is triggered***) - then use the new data to send a notification to Slack.  Before I proceed, let's look at the payload whenever the webhook event is triggered.  All I have to do is capture an order and see the data that gets logged in our server ... 

<p align="center">
  <img src="src/img/Guide-4/webhook-capture-payload.JPG">
</p>

With further investigation you'll notice this looks a lot like the response returned whenever an order is captured using the SDK helper function! We should take a step back and look at the big picture.  Because of this webhook provided by Commerce.js - whenever an order is captured the system will send that receipt data to the specified URL.  On the server side all I have to do is take that data and perform whatever task needed &#129299;. 

### Step 6. Send Notification Message to Slack Channel

Now that I have the necessary data to compile a notification - I need to decide what to send to Slack.  I won't be grabbing everything but just some important data I would like to be notified about in the event an order has been captured: 

- reference_id
- name
- email
- country
- '#' of items ordered
- order amount

I will [deconstuct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) in order to get the data I need: 

```
// *** server.js ***

let { customer_reference, customer, shipping, order } = req.body.payload
```

#### Sending messages to Slack

In the spirit of webhooks - Slack has the ability to add incoming webhooks in order to post messages in a particular Slack workspace.  In order to acheieve this, you **MUST** create a Slack App and give the specified Slack workspace access to the app.  [Here is a step by step!](https://slack.com/help/articles/115005265063-Incoming-Webhooks-for-Slack)

For testing I created a brand new Slack workspace and gave the proper access to my Slack App "New Order".  


<!-- ### Step 2. Add Checkout Button & Setup Route to Form
<p align="center">
  <img src="src/img/Guide-3/checkout-button.JPG">
</p>

The next thing I need to do is add a checkout button to the cart modal where all my products are listed.  Adding the button is pretty straight forward, but this button will have an `onClick` which will call a function with a few triggers - one of them is routing to my checkout form.  

```javascript
// *** CartModal.js ***
<Button 
    floated='left' 
    size='big' 
    color='blue' 
    onClick={goToCheckout}
>
    Checkout
</Button>
```

```javascript
// *** CartModal.js ***
const goToCheckout = e => {
    history.push(`/checkout/${props.cart.id}`)
    localStorage.setItem('cart-id', props.cart.id)
    props.setModalOpen(false)
    props.setCheckout(true)
}
```

React Router has a history object that I use here to 'push' the customer to the page of your choice.  In this case to the checkout page.  I'm also adding the `cart_id` to the URL.  The `cart_id` is needed data for important SDK helper function calls, so adding it the URL makes it easy to access in the next component.  

I'm also adding the `cart-id` to local storage as trigger for the private route. Basically if there's no `cart-id` in local storage - you can't route to this page.  `props.setModalOpen(false)` is the trigger to close the modal and `props.setCheckout(true)` is the trigger to NOT show the cart icon in the Nav (*I want to hide the icon during checkout*). 

#### Setting up your Route

As previously mentioned, this is not a deep dive into React or React Router, but here's an overview on setting up some routes.  First I need to install the proper dependencies:

```
// This package provides the core routing functionality for React Router

npm install react-router 

    - or -

yarn add react-router
```

```
// DOM bindings for React Router.

npm install react-router-dom

    - or -

yarn add react-router-dom
```  
 
 In the index.js file I need to import the BrowserRouter: 

```javascript
// *** index.js ***
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
    <Router>
        <App />
    </Router>
,document.getElementById('root'));
```

I'm wrapping the `<Router>` component around the `<App />` component so everything in my `<App />` component can access any routes I setup.  All the routes for your app will be setup in the `App />` component.  If you take a look in the `App.js` you'll notice a `Route` import: 

```
import { Route } from 'react-router-dom'
```

This component will be used to render the `<CheckoutContainer>` component based on a few properties ... 

```javascript
// *** App.js ***
<PrivateRoute 
    component={CheckoutContainer}
    path={`/checkout/:id`} 
    setCheckout={setCheckout}
    setModalOpen={setModalOpen}
    setReceipt={setReceipt}
/>
```

*** *Note *** `<PrivateRoute />` (**check PrivateRoute.js**) is a Higher Order Component created as sort of a middleware to allow logic to determine where a customer is routed*

You will notice the [component prop](https://reacttraining.com/react-router/web/api/Route/component) which is set equal to the component that needs to be rendered.  The path is what the URL will be for this route, and the rest of the props are needed to be passed along to be used in the `<CheckoutContainer />` component.  Here's another route setup for the homepage:

```javascript
// *** App.js ***
<Route exact path="/" render={props => {
    return (
        <ProductContainer 
            {...props}
            addToCart={addToCart}
            setCheckout={setCheckout}
        />
    )
}}/>
```
Because this isn't a '*Private Route*' I use the [render prop](https://reacttraining.com/react-router/web/api/Route/render-func) which takes a function and returns your component.  So anytime a customer hits the home page, they will be routed to our `<ProductContainer />` component (*component that is listing my products*).  

If you recall for the checkout button I pushed the customer to this path: 
```
history.push(`/checkout/${props.cart.id}`)
```
And in App.js, I have a route setup to that exact path: 
```
<PrivateRoute 
    component={CheckoutContainer}
    path={`/checkout/:id`} 
```

the `:id` is just a foo name that is a variable for whatever text you put there.  In our case we're setting `props.cart.id` equal to `:id`.  This can later be accessed on the [match object](https://reacttraining.com/react-router/web/api/match) - `props.match.params.id`

![](src/img/Guide-3/checkout-url.JPG)

#### The `<CheckoutContainer />` Component

How you setup your React app and organize your components can vary.  I decided to have a `<CheckoutContainer />` component that will contain my form and other essential data necessary for checkout.  One of the most important features of the Commerce.js SDK is the checkout token.  The checkout token is your key or access to all the information needed to capture a checkout.  Further it has the live object which contains the most up date data in regards to items, shipping methods etc... [Read more about the Checkout Token](https://commercejs.com/docs/examples/capture-checkout.html)

In the `<CheckoutContainer />` component I will be generating the checkout token.  I will use the `commerce.checkout.generateToken()` helper function and wrap this in an `useEffect()`  - so that any time this component is loaded, I will always set the live object in state: 

```javascript
useEffect(() => {
    // *** CheckoutContainer.js ***

    /* *** Getting Checkout Token - Set Live Object in State *** */

    let cartId = props.match.params.id
    commerce.checkout.generateToken(cartId, { type: 'cart' })
        .then(res => {
            setLiveObject(res.live)
            setTokenId(res.id)
        })
        .catch(err => {
            console.log(err)
        })

    props.setCheckout(true)
},[])
```

The function takes the cartId (which is retrieved from the [match object](https://reacttraining.com/react-router/web/api/match) `props.match.params.id`) and a second object that tells the type.  I grab the checkout token in the response and store that in state along with the live object.  

Because the live object contains so much valuable data, I can build triggers for certain UI based on the data changes.  I also send this live object to my form in order to build the `line_items` object later needed for capture.  



Now that my routes are setup and I'm generating my checkout token - it is time to build your form! 

### Step 3. Create Form

Before you create your form, it's good to determine what data is needed in order to process an order.  There are four main properties needed: **Customer** (*name, email etc...*), **Shipping** (*address, country etc...*), **Payment** (*card info, payment gateway*), **Fulfillment** (*whatever shipping method was selected*). Head over to the [docs](https://commercejs.com/docs/examples/capture-checkout.html) to get a better look at the final object you'll be sending to the Chec dashboard.   

*** *Note *** There's also **Billing** but it holds the same 'sub-properties' as Shipping - so I have logic setup to only include **Billing** if the customer's billing address is different than their shipping.*

Each main property is an object which contains more properties 'sub-properties' of data that needs to be collected.  Take a look! 

```
customer: {
    firstname: 'Van',                   
    lastname: 'Williams',
    email: 'van.doe@example.com',
  },
  shipping: {
    name: 'Van Williams',
    street: '123 Fake St',
    town_city: 'Nashville',
    county_state: 'TN',
    postal_zip_code: '94103',
    country: 'US',
  }
```
I will be building my form using [Semantic UI](https://react.semantic-ui.com/collections/form/) components instead of the standard `<input />` element.  It is essentially the same implementation except you will see extra properties specific to the custom component provided by [Semantic UI](https://react.semantic-ui.com/).  Let's look at each main property: 

#### Customer

![](src/img/Guide-3/customer-info.JPG)

```javascript
// *** CheckoutForm.js ***
<Form.Input
    fluid
    name="firstname" 
    label='First Name'
    placeholder='John'
/>
<Form.Input 
    fluid 
    name='lastname' 
    label='Last name' 
    placeholder='Smith'
/>
<Form.Input 
    fluid 
    name='email'
    label='Email' 
    placeholder='xyz@example.com'
    type='email'  
/>
```

As you can see, the properties are the same like `name`, `placeholder` that you would use for a normal `<input />` element.  

#### Shipping

![](src/img/Guide-3/shipping-info.JPG)

```javascript
// *** CheckoutForm.js ***
<Form.Group>
    <Form.Input 
        width={10} 
        name='street' 
        label='Address' 
        placeholder='122 Example St'   
    />
    <Form.Select
        width={6} 
        name='country' 
        label='Select Country' 
        options={countries}
    />
</Form.Group>
<Form.Group>
    <Form.Input 
        width={6} 
        name='town_city' 
        label='Town/City' 
        placeholder='Las Vegas' 
    />
    <Form.Select
        width={6} 
        label='County/State/Province/Territory' 
        placeholder='Search ...'
        name='county_state' 
        search 
        fluid
        options={getCountryInfoShipping()}
    />
    <Form.Input
        width={4} 
        type='number'
        name='postal_zip_code' 
        label='Zip/Postal' 
        placeholder='00000'
    />
</Form.Group>
```

For [dropdowns](https://react.semantic-ui.com/modules/dropdown/#types-search-selection-two) in Semantic UI there's an options prop that takes an array of objects of different options a customer can choose.  

```
// *** Countries.js ***

export const countries = [
    {
    value: "CA",
    text: "Canada"
    },
    {
    value: "MX",
    text: "Mexico"
    },
    {
    value: "US",
    text: "United States"
    }
]
```

As the store owner and for this example I already set up shipping for only three countries.  These will be the only choices a customer can choose in order to ship.  Once a customer chooses thier country it will trigger a different set of options based on that country.  In order to achieve this I compiled a list of all territories/states/provinces for each country (*see the North America folder under utils*).    

So, the options property for this dropdown ... 

```
// *** CheckoutForm.js ***

<Form.Select
    width={6} 
    label='County/State/Province/Territory' 
    placeholder='Search ...'
    name='county_state' 
    search 
    fluid
    options={getCountryInfoShipping()}
/>
```
is set to a function - this function checks what Country was selected and returns the proper array for that country: 

<p align="center">
  <img src="src/img/Guide-3/countryG.gif">
</p>

```
// *** CheckoutForm.js ***

const getCountryInfoShipping = () => {

    /* *** Gives user proper options based on Shipping Country *** */
    
    if (shipCountry === 'MX') {
        return mexico
    }

    if (shipCountry === 'CA') {
        return canada
    }

    if (shipCountry === 'US') {
        return stateOptions
    }
}
```

#### Payment

<p align="center">
  <img src="src/img/Guide-3/payment-info-n.JPG">
</p>

```javascript
// *** CheckoutForm.js ***
<Form.Group className='payment-radio'>
    <input
        name='gateway' 
        type='radio'
        value='test_gateway'
    />
    <label htmlFor="test_gateway">Test Gateway</label>
    <input
        name='gateway' 
        type='radio'
        value='stripe'
    />
    <label htmlFor="stripe">Credit Card</label>
</Form.Group>
<Form.Group>
    <Form.Input
        name='number'
        type='number' 
        label='Credit Card Number' 
        placeholder='0000111100001111' 
    />
    <Form.Input
        name='postal_billing_zip_code' 
        type='number'
        max='99999'
        label='Billing Zip' 
        placeholder='Enter Billing Zip Code'
    />
</Form.Group>
<Form.Group>
    <Form.Select 
        width={3} 
        name='expiry_month' 
        fluid 
        options={monthOptions} 
        label='Month' 
    />
    <Form.Select 
        width={3} 
        name='expiry_year' 
        fluid 
        options={yearOptions} 
        label='Year' 
    />
    <Form.Input 
        width={3} 
        name='cvc'
        type='number'
        label='CVC' 
        placeholder='123'
    />
</Form.Group>
```

These are all the fields needed to collect information about payment.  I had to bring in arrays (`monthOptions`, `yearOptions`) for the options props in regards to month/year card expiration.  

#### Fufillment

<p align="center">
  <img src="src/img/Guide-3/shipping-option.JPG">
</p>

This is the last important piece of data you need to complete a checkout.  The customer needs to be able to select a shipping option.  The shipping option is determined by country - remember our shipping zones?  

**For example:** If the customer chooses Canada as their shipping country, then we run a function with that country code in order to give a shipping option to choose from.  This option determines the price for shipping to your country. For this store - I'm charging $8 dollars flate rate to ship to Canada.

Because I've separated the shipping options from the main form (*where I'm gathering all the other data*), I have to pass a function via props to our form.  This function is wrapped in a `useEffect()` and gets triggered every time a different country is selected.  

```
useEffect(() => {
    // *** CheckoutForm.js ***

    /* *** Takes the Shipping Country and updates shipping Options *** */
    props.getShippingOptions(shipCountry)
}, [shipCountry])
```

Let's take a look at the `getShippingOptions()` function: 

```javascript
// *** CheckoutContainer.js ***
const getShippingOptions = (countrySymbol) => {

    /* 
    Getting the Customer's Shipping Options based on the Country
    Function is triggered once user selects country in CheckoutForm. 
    */

    if (countrySymbol) {
        commerce.checkout.getShippingOptions(tokenId, {
            country: countrySymbol
        })
            .then(res => {
                let shippingOptionsArray = res.map(option => {
                    let shInfo = {}

                    shInfo.key = countrySymbol
                    shInfo.text = `${option.description}(${option.price.formatted_with_code})`
                    shInfo.value = option.id
        
                    return shInfo
                })
                setShippingOptions(shippingOptionsArray)
            })
            .catch(err => console.log(err))
    }
}
```

This function is using the `commerce.checkout.getShippingOptions()` [helper function](https://commercejs.com/docs/overview/getting-started.html) to go and retrieve the shipping option based on the country symbol (*I pass that data in as an argument*).  The response is an array of shipping options and I'm mapping over that array in order to format the data that gets passed to the options property in the selection dropdown element. I then put that array into state for later consumption. 

Here's a look at the code for the dropdown: 

```
<Dropdown
    placeholder='Select Shipping Method'
    fluid
    selection
    options={shippingOptions}
    onChange={handleDropDownShipping}
/>
```

The last part is that I want to apply the shipping option to the cart total and update the total cost.  The Commerce.js SDK makes this easy because they provide a function that when given a shipping option and a checkout token, you get back an updated live object.  All you have to do is update state with the new live object and all of the data depending on that object will get updated.  

```javascript
// *** CheckoutContainer.js ***

const handleDropDownShipping = (e, {value, options}) => { 
        
    /* 
    Applies shipping option to Cart Total
    Updates Live Object in state 
    */

    commerce.checkout.checkShippingOption(tokenId, {
        id: value,
        country: options[0].key
    })
        .then(res => {  
            setShipOption(value)
            setLiveObject(res.live) 
        })
        .catch(err => console.log(err))

}
```

As you can see I'm using `commerce.checkout.checkShippingOption()` helper function and passing it the checkout token and an object with the `shipping_option_id` and `country`.  As mentioned the response contains an updated live object so I update state and also set the `shipping_option_id` - (`setShipOption(value)`) in state so that info can be sent to the Chec dashboard for when I finally capture the checkout. 

<p align="center">
  <img src="src/img/Guide-3/shippingG.gif">
</p>

Yay! You have built your form and made sure you have all the fields necessary to capture an order.  You also confirmed that whenever a customer selects a country, they are then able to apply a shipping option to the total cost.  Now it's time handle all the data. 

### Step 4. Handling Form Data/Validation/Errors

Typically speaking at this point you would need to apply some `onChange` events to each of your inputs and dropdowns.  Then build a function that takes the input data and stores it into state.  After that you would probable write an `onSubmit` function to grab all the data in state and finally do something with it.  Within your `onSubmit` function is where you would handle errors and things of that nature.  

I am going to make your programming lives easier by using a third party library called [React Hook Form](https://react-hook-form.com/api/).  This is a form validation and form error handling library that makes the handling of data much easier.  When configured properly you don't have to apply change handler functions to each input and manually program errors in the event field data is missing.  

This is very important for UX (user experience) that the customer is informed visually if they left something blank or typed something incorrectly. I want to apply as much data validation as possible before sending data to be processed by Chec dashboard.  When programming our `onSubmit`function we know the data coming in has been validated.  

Let's add the dependency `npm install react-hook-form` or `yarn add react-hook-form`.  I will now bring in a component and a hook from the library: 

```
import { useForm, Controller } from 'react-hook-form'
```

*** *Note *** The power of this library is quite intense and this guide by no means explains this libarary in detail.  You may find another library for validation better such as formik or yup.  But this is a lightweight simple option for what we need to accomplish.*  

In order to configure everything properly we need to wrap our input elements with the `<Controller />`  component from `react-hook-form`.  We also will use a few helpful properties from within the `useForm()` hook: 

```
const { register, handleSubmit, errors, control, reset } = useForm()
```

[These properties and how they work further explained](https://react-hook-form.com/api#useForm) 

Let's take a look at some inputs to see how we configured them using `react-hook-form`: 

```javascript
// *** CheckoutForm.js ***
<Controller
    fluid
    id='customer' 
    name="firstname" 
    label='First Name'
    placeholder='John'
    control={control}
    as={Form.Input} 
    rules={{ required: "Please enter Firstname" }}
    error={errors.firstname && errors.firstname.message} 
/>
```

My input for getting firstname data now looks like this.  I used the `<Controller />` component from the library along with a few extra props.  The rules prop allows me to set rules for this input.  It takes an object with a property `required`.  It sets this input to be required and if left empty, an error gets added to the errors object based on the name.  Semantic UI has an error prop we can add and easily attach errors to any field left empty. 

![](src/img/Guide-3/customer-error.JPG)

All the dropdown inputs will work slightly different in that need we to attach an `onChange` property that returns the selected option: 

```javascript
// *** CheckoutForm.js ***
<Controller
    fluid
    search 
    width={6} 
    label='County/State/Province/Territory' 
    placeholder='Search ...'
    name='county_state' 
    options={getCountryInfoShipping()}
    as={Form.Select}
    control={control}
    rules={{ required: "Must Select Country First" }}
    error={errors.county_state && errors.county_state.message} 
    onChange={(e) => e[1].value}
/>
```

It's a similiar process except we have the `onChange` that returns the value selected.

#### The `handleSubmit()` function

So I've wired up each input using the third party `react-hook-form` and made sure all the errors work properly.  Here comes the real power within the library if you recall the handleSubmit property that was brought in from the `useForm()` hook: 

```
const { register, **handleSubmit**, errors, control, reset } = useForm()
```

I will now pass my `onSubmit` function to the `react-hook-form`'s `handleSubmit()`: 

```
<Form className='checkout-form' onSubmit={handleSubmit(onSubmit)} loading={processing}>
```

Let's take a look at our function that we're passing to `handleSubmit()`. 

```
const onSubmit = (data) => {
    console.log(data)
}
```

As you can see there's an argument `data` that we will log and get some eyes on what is passed to our function.  You'll notice that all of the form data has been set as the value and each name set as the key.  

<p align="center">
  <img src="src/img/Guide-3/data-object.JPG">
</p>

We have all the data from the form!  The convenient part is that this function never runs unless all input meets validation.  I set required to all inputs so this function ONLY runs if nothing is left blank.  All that is left is formatting the data properly to match how the Commerce.js SDK will process our data.  

### Step. 5 Handling Discount Code

One last quick procedure (*before we capture*) and that is handling a discount code. You must first add the discount code in your Chec dashboard. Navigate to discounts from the left-side menu and then click Add Discount: 

![](src/img/Guide-3/discount.JPG)

I will be setting one discount code and it will be **LUCKY**.  You have the option to apply the code to a particular product, but to keep it simple I will add the code to all products.  I now need to add an input and a button: 

```javascript
<form className='discount-code' onSubmit={handleDiscountClick}>
    <Input onChange={handleDiscountCode} />
    <Button color='black'>Apply</Button>     
</form>
```

As mentioned before in regards to selecting the shipping option - the discount code input is separate from our 'main' form (*no need for `react-form-hook` to handle one input*).  The input has a `onChange` that simply stores whatever is typed into state.  The `onSubmit` will take that text and try to apply the code.  

```javascript
// *** CheckoutContainer.js ***
const handleDiscountClick = (e) => {

    /* *** Checking to Make Sure Discount Code is Valid *** */

    e.preventDefault()

    if (!discountCode) {
        setNoDiscountCode(true)
        setInvalidDiscountCode(false)
    } else {
        commerce.checkout.checkDiscount(tokenId, {code: discountCode})
            .then(res => {  
                if (!res.valid) {
                    setInvalidDiscountCode(true)
                } else {
                    setInvalidDiscountCode(false)
                    setLiveObject(res.live)
                    setDiscountCode(null)
                }
                
                setNoDiscountCode(false)
            })
            .catch(err => console.log(err))
    }
}
```

I'm using the `commerce.checkout.checkDiscount()` which takes the checkout token and the discount code.  I have a few different state triggers setup to display different message depending on different outcomes. If no discount code is entered, the customer will see - "No Discount Code Entered".  The response of the function call has a property `valid`.  You can simply setup logic based off the `res.valid`.  If `res.valid` is true then you just update the live object with the updated live object that gets returned.  

<p align="center">
  <img src="src/img/Guide-3/discountG.gif">
</p>

### Step 6. Capture Checkout / Route to Thank You Page

Now that all the data has been validated and we're able to access said data from the `data` object that gets passed to the `onSubmit` - let's format the data and get it ready for capture.  I want to revisit earlier in the guide before we built the form.  I mentioned the four main properties and how each property was set to another object with 'sub-properties'.  

You can reference the [Commerce.js](https://commercejs.com/docs/examples/capture-checkout.html) docs again to see what the shape of our data needs to be.  It appears as though I have all the data needed except the `line_items`.  Because I'm sending the live object to our form via props - we have access to the `line_items`.  I will utilize an `useEffect` here so that I ensure every time the form is rendered, I'm getting the latest items in our cart.  

```javascript
// *** CheckoutForm.js ***
useEffect(() => {

    /* 
        Takes Line Items from props and strutures the data 
        Object added to state   
    */

    let lineItems = {}

    props.liveObject.line_items.forEach(item => {

        lineItems = {
            ...lineItems,
            [item.id]: {
                quantity: item.quantity,
                variants: {
                    [item.variants[0].variant_id]: item.variants[0].option_id
                }
            }
        }
    })

    setLineItems(lineItems)

}, [])
```

I'm iterating through each item building the `line_items` property to match the SDK.  The nested object's key is the `item.id` (*`item` is each line item*) and the value is an object with `quantity` and `variants`.  Once our newly created `lineItems` object is built - I set that value in state.   

*** *Note *** I'm using `item.variants[0]` because as the store owner, I only created one variant.*

```
line_items: {
    // Key is the line item ID for our test product
    item_7RyWOwmK5nEa2V: {
      quantity: 1
      variants: {
        // Key is the variant ID for "Color", value is the option ID for "Blue"
        vrnt_bO6J5apWnVoEjp: 'optn_Op1YoVppylXLv9',
        // Key is the variant ID for "Size", value is the option ID for "Small"
        vrnt_4WJvlKpg7pwbYV: 'optn_zkK6oL99G5Xn0Q',
      }
    }

    https://commercejs.com/docs/examples/capture-checkout.html
```

You now have the last piece of data needed to finalize an order and capture a checkout. Let's put this all together and complete our `onSubmit()`: 

```javascript
// *** CheckoutForm.js ***
const onSubmit = (data) => {

    /* *** 
        Takes in all the data gathered from the Form
        Parses the data properly to match the shape for capture
    *** */

    setProcessing(true)

    let final = {}

    final.line_items = lineItems

    final.fulfillment = {
        shipping_method: props.shipOption
    }

    final.customer = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email
    }

    final.shipping = {
        name: `${data.firstname} ${data.lastname}`,
        street: data.street,
        town_city: data.town_city,
        county_state: data.county_state,
        postal_zip_code: data.postal_zip_code,
        country: data.country
    }

    if (!sameBilling) {
        final.billing = {
            name: data.billing_name,
            street: data.billing_street,
            town_city: data.billing_town_city,
            county_state: data.billing_county_state,
            postal_zip_code: data.billing_postal_zip_code,
            country: data.billing_country
        }
    }

    final.payment = {
        gateway: data.gateway,
        card: {
            number: data.number,
            expiry_month: data.expiry_month,
            expiry_year: data.expiry_year,
            cvc: data.cvc,
            postal_zip_code: data.postal_billing_zip_code,
        }
    }

    if (props.shipOption) {
        commerce.checkout.capture(props.tokenId, final)
            .then(res => {
                props.setReceipt(res)
                localStorage.removeItem('cart-id')
                setProcessing(false)
            })
            .catch(err => {
                window.alert(err.data.error.message)
                setProcessing(false)
            })
    }
    
}
```

Because the data object has everything needed, I can build the `final` object however necessary and pass that to the `commerce.checkout.capture()`. The last trigger that determines if a capture is run is the **`props.shipOption`** - this Boolean toggles true/false depending on if a shipping option is selected. So if there's no shipping option selected - the customer will NOT be able to complete their order.  

#### Route to Thank You page

The last step is routing the customer to a Thank You Page and I built the `<CheckoutComplete />` component to handle this.  One of the last layers of data validation comes from the Chec API.  The backend is setup to check U.S. zip codes based on the state and other error checking that comes in handy.  I set an alert box to display any messages from the backend.  If there are no errors I have a few triggers, but most importantly I'm pushing the customer to the `<CheckoutComplete />` page. 

```javascript
// *** CheckoutForm.js ***
commerce.checkout.capture(props.tokenId, final)
    .then(res => {
        props.setReceipt(res)
        localStorage.removeItem('cart-id')
        setProcessing(false)
        history.push(`/order-complete/${props.tokenId}/${res.id}`)
    })
    .catch(err => {
        window.alert(err.data.error.message)
        setProcessing(false)
    })
```

![](src/img/Guide-3/order-complete.JPG)

#### Locate Order in Dashboard

Once you complete a test order using the test gateway, navigate to your dashboard and find the order that was just placed.  

![](src/img/Guide-3/order-chec.JPG)

#### Conclusion 

You can now capture orders for your eCommerce website! Hopefully by this point, you can see the benefits of using the Commerce.js SDK and all the helper functions that assist in building the functionality.  In regards to capturing an order, you need to be able to gather all the data necessary - parse that data to match the proper shape needed for the SDK, then capture! Once complete, you'll have the record in your dashboard and can perform any further duties to fulfill the order. Here's a quick summary of what was covered in this guide: 
 
- created a shipping zone and applied the zone to your products
- added a checkout button and setup routes to navigate the site
- generated a checkout token and added it to state
- handling form data which includes validation and errors
- added a discount code option 
- gathering form data and capturing a checkout 

**If you're interesting in implementing stripe as a payment gateway keep reading below ...**


This guide is a continuation of a previous guide:
 - [Adding Products to a Cart](https://github.com/kingmoc/adding-products-cart-cjs-react) - if you're wondering how to even add products to your cart, check out this guide.   

[LIVE DEMO](https://seities-store-cjs-react-guide.netlify.com/)

## Built With

* [React.Js](https://reactjs.org/docs/getting-started.html)
* [Semantic-UI](https://react.semantic-ui.com/)
* [Commerce.js (SDK)](https://commercejs.com/docs/)
* [React Hook Form](https://commercejs.com/docs/)


## *** Extra *** 
### Implementing Stripe

So you've tested your payment gateway and now you want to try using Stripe to process a customer's payment.  Stripe is one of the best third party payment processing platforms available and the Chec dashboard provides Stripe integration.  Just to note, it's not a complete integration in that you still need to connect to Stripe and get an important piece of data (a token) and provide that as apart of your capture.  Let's break it down! 

### Step 1. Get Stripe Acount

This is pretty obvious but you need a personal stripe account in order to use their system.  Head over to [Stripe](https://dashboard.stripe.com/register) and setup an account.  Once your account is created, the most important information needed is your API keys. Stripe has two keys: **Publishable & Secret** - they both come with a *test* version and *live* version.  Make sure to only copy the **TEST** keys in that you do not want to accept live payments during testing.  

<p align="center">
  <img src="src/img/Guide-3/test-keys.JPG">
</p>


### Step 2. Enable Payment Gateway in Chec Dashboard

Navigate to your Chec dashboard and in the settings, click **payment gateways**.  Once you're able to see all the different gateway options, enable Stripe. Chec will ask for both publishable and secret keys in order to complete enabling the gateway. 

<p align="center">
  <img src="src/img/Guide-3/pay-gate-stripe.JPG">
</p>

### Step 3. Create Card Token

This particular step can be done many ways.  The end goal is to [create a card token](https://stripe.com/docs/api/tokens/create_card).  Stripe essentially encapsulates sensitive data into what they call [tokens](https://stripe.com/docs/api/tokens).  These tokens can then be sent to stripe in order to process that information.  

As mentioned creating such tokens can be done a few different ways (such as using Stripe's SDK) - but I'm going to use my Stripe API keys to connect directly to the token endpoint. Once we're able to successfully retrieve a token (which will hold the customer's card information) - I will send that token instead of the card info with the capture ...

#### Axios

I need a way to make an API call and [axios](https://www.npmjs.com/package/axios) is the preferred method.  Because I already know the endpoint I need to access is not open, I built an `axiosWithAuth()` function to hold sensitive data needed to make an API call to Stripe: 

```javascript
// *** axiosWithAuth.js ***
import axios from 'axios'

export const axiosWithAuth = () => {
    const token = process.env.REACT_APP_SECRETKEY_STRIPE

	return axios.create({
        baseURL: 'https://api.stripe.com/v1',
		headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/x-www-form-urlencoded'
        },
	})
}   
```

Stripe uses a ***bearer*** token (*your secret key from Stripe*) and also something else called `application/x-www-form-urlencoded`. This means I won't be able to send `json` objects in the request body.  Don't worry - you an use [this library](https://www.npmjs.com/package/qs) to create the proper formatting for your data.  

Now that I have everything setup: `baseURL`, `token`, and `Content-Type` - let's grab the data needed for Stripe, send it to the proper endpoint, retrieve the token: 

```javascript
// *** CheckoutForm.js ***
let stripInfo = {
    name: `${data.firstname} ${data.lastname}`,
    number: data.number,
    exp_month: data.expiry_month,
    exp_year: data.expiry_year,
    cvc: data.cvc,
    address_zip: data.postal_billing_zip_code
}

axiosWithAuth().post('/tokens', qs.stringify({card: stripInfo}))
    .then(res => {
        console.log(res, 'res from token call')
    }
```

If you recall, I already have the data needed (*from the `data` object*) to create the token.  The property names are slightly different which is why I'm creating a new object `stripInfo`. I'm using the [qs](https://www.npmjs.com/package/qs) library to format the data into `application/x-www-form-urlencoded`.  Stripe requires the data to be nested in the card property.  

I `console.log` the `res` to make sure I'm getting back the information needed.  

```
{
  "id": "tok_1GLg0dL2SfeRK8Enq6gw4peg",
  "object": "token",
  "card": {
    "id": "card_1GLg0dL2SfeRK8EnJ3XQPe8P",
    "object": "card",
    "address_city": null,
    "address_country": null,
    "address_line1": null,
    "address_line1_check": null,
    "address_line2": null,
    "address_state": null,
    "address_zip": null,
    "address_zip_check": null,
    "brand": "Visa",
    "country": "US",
    "cvc_check": null,
    "dynamic_last4": null,
    "exp_month": 8,
    "exp_year": 2021,
    "fingerprint": "m3436v72h7fryyG9",
    "funding": "credit",
    "last4": "4242",
    "metadata": {},
    "name": null,
    "tokenization_method": null
  },
  "client_ip": null,
  "created": 1583977131,
  "livemode": false,
  "type": "card",
  "used": false
}
```

The token id is the first property listed and that is what I will send along with the capture.  

### Step 4. Setting up Stripe logic

Now that I'm offering two different payment methods, I need to reflect that to the user.  I will have two radio buttons that the customer can choose for payment processing.  

<p align="center">
  <img src="src/img/Guide-3/radio-pay.JPG">
</p>

Based on the `data` object, I know the value of the radio button will be attached to `data.gateway` (*that is the name set for those input types*).  Whichever the customer selects will determine what happens next.  If **Credit Card** is chosen, that means I need to get the token and perform a capture with the token info - same with **Test Gateway**.  

```javascript
// *** CheckoutForm.js ***
if (data.gateway === 'stripe') {

    let stripInfo = {
        name: `${data.firstname} ${data.lastname}`,
        number: data.number,
        exp_month: data.expiry_month,
        exp_year: data.expiry_year,
        cvc: data.cvc,
        address_zip: data.postal_billing_zip_code
    }

    axiosWithAuth().post('/tokens', qs.stringify({card: stripInfo}))
        .then(res => {
            final.payment = {
                gateway: data.gateway,
                card: {
                    token: res.data.id
                }
            }

            if (props.shipOption) {
                // Peform capture with updated payment 'sub-properties'
            }
        })
        .catch(err => {
            console.log(err.data, 'error message')
        })
} else {
    // Perform some other action
}
```

If successful, you update the `payment` object with only the token (***no need for the other data because all the information needed is encapsulated in the token***). Then you just continue as before - if a shipping option is selected, then perform the capture with the updated **`final`** object.  

### Step 5. Capture Checkout

Everything is setup to complete and finalize the customer's order.  I'm getting the token, I've setup the logic, now just complete the checkout.  We can proceed in similar fashion as before in that all I need to do is include the proper **`final`** object depending on which option the customer chooses. 

```javascript
// *** CheckoutForm.js ***
if (props.shipOption) {
    commerce.checkout.capture(props.tokenId, final)
        .then(res => {
                props.setReceipt(res)
                localStorage.removeItem('cart-id')
                history.push(`/order-complete/${props.tokenId}/${res.id}`)
                setProcessing(false)
        })
        .catch(err => {
                window.alert(err.data.error.message)
                setProcessing(false)
        })
}
```

*** *Note *** When using Stripe for testing there are many different card numbers that Stripe suggest using for testing.  For example - **4242424242424242** with any CVC and future expiration date is best for testing.  However if you want to accept cards that require further authentication, there will be more configuration needed.  [Check here for a list of all the different test cards available for Stripe](https://stripe.com/docs/testing)*

Once you've put all the necessary info into the form go ahead and test the Stripe payment gateway.  If successful you can check your Stripe dashboard and confirm the payment went through. 

[Live demo for this Guide: "***Creating a single page checkout***"](https://seities-store-cjs-react-guide.netlify.com/)

<p align="center">
  <img src="src/img/Guide-3/complete-order-stripe.JPG">
</p> -->

