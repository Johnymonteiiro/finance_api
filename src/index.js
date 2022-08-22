const express = require("express");
const { v4: uuid } = require("uuid")
const app = express();

app.use(express.json())

/**
 * cpf:string
 * id:uuid
 * name:string
 * statement:[]==> extrato
 */


const customers = [];

//criando os middwares:
function verifyExisteAccountCPF (request,response,NEXT) {
  const { cpf } = request.headers

  const customer = customers.find((customer)=> customer.cpf === cpf);

  if(!customer) {
    return response.status(401).json({message: "Customer not found!"})
  }

  request.customer = customer;

  return NEXT()
}

//Balanço da conta:
function getBalance (statement){

 const totalAmount = statement.reduce((acc,operation) =>{
  if(operation.type === 'credit'){
    return acc + operation.amount
  } else {
    return acc - operation.amount
  }
 },0)

 return totalAmount;
}


//Creating a user account:
app.post('/account',(request, response )=>{
  const { cpf,name } = request.body

  const customerExist = customers.some(customer => customer.cpf === cpf);

  if(customerExist){
    return response.status(400).json({message: "Custumer already exists!"})
  }

  customers.push({
    id: uuid(),
    cpf,
    name,
    statement:[]
  })
  
  console.log(customers);

  return response.status(201).send('Account created')
})

//Buscar extrato bancário do cliente:
app.get('/statement', verifyExisteAccountCPF,(request,response)=>{
  const { customer } = request;

  const balance = getBalance(customer.statement)

  const totalBalance = {
    statement: customer.statement,
    balance
  }

  return response.json(totalBalance)
})

//Fazer Deposito:
app.post('/deposit', verifyExisteAccountCPF,(request,response) =>{

  const { description ,amount } = request.body

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    cerated_at: new Date(),
    type:"credit"
  }
  customer.statement.push(statementOperation)

  response.status(200).json({message:'Deposit done'})
})

//Fazer Saque:
app.post('/withdraw', verifyExisteAccountCPF,(request,response) =>{
  const { amount } = request.body
  const { customer } = request;

  balance = getBalance(customer.statement)
  
  if(balance < amount){
    return response.status(400).json({message:"Insuficient credit!"})
  }

  const statementOperation = {
    amount,
    cerated_at: new Date(),
    type:"debit",
  }

  customer.statement.push(statementOperation)

  response.status(200).json({message:'Withdraw done!'})
})


//Buscar extrato bancário do cliente por data:
app.get('/statement/date', verifyExisteAccountCPF, (request,response)=>{
  const { customer } = request;
  const { date } = request.query

  const dateFormated = new Date(date + " 00:00")
  const balance = getBalance(customer.statement)
  
  const statement = customer.statement.filter((statement) => 
  statement.cerated_at.toDateString() === new Date(dateFormated).toDateString())

  const statementByDate = {
    statement,
    balance
  }

  return response.json(statementByDate)
})

//Atualizar os dados do cliente:
app.put('/account',verifyExisteAccountCPF,(request,response)=>{
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;
  return response.status(201).json({message: "account updated"})
})

//Obter os dados da conta:
app.get('/account',verifyExisteAccountCPF,(request,response)=>{
  const { customer } = request;
  const balance = getBalance(customer.statement)
  
  const accountDate = {
    customer,
    balance
  }
  return response.status(201).json(accountDate)
})

//Delete account:
app.delete('/account',verifyExisteAccountCPF,(request,response)=>{
    const { customer } = request;

    //splice
    customers.splice(customer, 1)
    return response.status(200).json(customers)
})

app.listen(3333)