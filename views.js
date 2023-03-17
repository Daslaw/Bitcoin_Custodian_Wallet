import inquirer from 'inquirer'
import Wallet from './wallet.js'
import { bitcoin } from './functions.js';

var ui = new inquirer.ui.BottomBar();

// prompt to ask for the user's crypto wallet address. We then call the prompt() 
// The then() method is used to log the user's wallet address
// catch() method is used to handle any errors that might occur

export function startView() {
    const options = [
        {
            type: 'list',
            name: 'authentication',
            message: `Welcome to ABDcrest Crypto Wallet`,
            choices: [
                {
                    key: 'login',
                    'name': 'Have an existing account: Log In',
                    value: 'login'
                },
                {
                    key: 'receive',
                    'name': 'New User, Click here to sign Up',
                    value: 'signup'
                },
                {
                    key: 'help',
                    'name': 'Need help',
                    value: 'help'
                },
 
                new inquirer.Separator('\n'),
                new inquirer.Separator(),
                'Do you need help? Click need help above'
            ]
        }
    ]

    
    inquirer
    .prompt(options)
    .then((answers) => {
        if (answers.authentication == 'login') {
            loginView()
        }
        else if (answers.authentication == 'signup') {
            signupView();
        } else {
            helpView()
        }
        
    })

    .catch( (error) => {
            if (error.isTtyError) {
                console.log(`This app could not be opened in this terminal environment`)
            } else {
                console.log(`Something went wrong, Try Again`)
            }
        })
}

function loginView() {
    const options = [
        {
            type: 'input',
            name: 'username',
            message: `Enter your crypto wallet username`,
            validate: function(value) {
                var done = this.async();
                Wallet.found(value, (found) => {
                    if (!found) {
                        done('Wallet username not found')
                        return
                    }

                    done(true)
                })
            }
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {
            dashboardView(answers.username)
        })
        .catch( (error) => {
            console.log(error)
        })
}

function signupView() {

    
    const options = [
        {
            type: 'input',
            name: 'username',
            message: `Enter your wallet username`,
            validate: function(value) {
                var done = this.async();
                Wallet.found(value, (found) => {
                    if (found) {
                        done('Username not registered, go back and create a new account')
                        return
                    }

                    done(true)
                })
            }
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {

            Wallet.create(answers.username, (result) => {
                if (result.error) {
                    ui.log.write("Error creating crypto wallet, Try Again");
                    return
                }

                dashboardView(answers.username)
            })
        })
        .catch( (error) => {
            console.log(error)
        })
}

async function sendView(user) {
    const inputs = [
        {
            type: 'input',
            name: 'amount',
            message: `How much crypto do you want to send?`,
            validate(value) {
                let invalid = isNaN(value)

                if (invalid) {
                    return 'Enter a valid crypto amount to send'
                }

                return true
            }
        },
        {
            type: 'input',
            name: 'Wallet address',
            message: `What crypto address do you want to send to?`,
        }
    ]


    await inquirer
    .prompt(inputs)
    .then( async (answers) => {
        let amount = bitcoin(answers.amount)
        let address = answers.address
       
        const send = await Wallet.send(amount, user, address)

        if (send.error) {
            ui.log.write('Hey, Error sending transaction: Try again')
            return
        }

        ui.log.write('Transaction sent' + amount)
    })
    .catch( (error) => {
        console.log(error)
    })
}

function helpView() {
    const options = [
        {
            type: 'list',
            name: 'help',
            message: 'What do you need help with?',
            choices: ['How to send crypto', 'How to receive crypto', 'How to check your balance'],
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {
                if (answers.help === 'How to send crypto') {
                  console.log('Here are the steps to send crypto:');
                  console.log('1. Log in to your wallet');
                  console.log('2. Click on "Send"');
                  console.log('3. Enter the recipient address and amount');
                  console.log('4. Click "Send"');
                } else if (answers.help === 'How to receive crypto') {
                  console.log('Here are the steps to receive crypto:');
                  console.log('1. Log in to your wallet');
                  console.log('2. Click on "Receive"');
                  console.log('3. Copy your wallet address');
                  console.log('4. Share your wallet address with the sender');
                } else if (answers.help === 'How to check your balance') {
                  console.log('Here are the steps to check your balance:');
                  console.log('1. Log in to your wallet');
                  console.log('2. Navigate to the "Balance" section');
                  console.log('3. Your balance will be displayed there');
                } else {
                  console.log('Invalid option selected.');
                }
              })
              .catch((error) => {
                console.error(error);
              });
            
}



function dashboardView(user) {

    const options = [
        {
            type: 'list',
            name: 'wallet',
            message: `What do you want to do?`,
            choices: [
                {
                    key: 'send',
                    'name': 'Send crypto',
                    value: 'send'
                },
                {
                    key: 'receive',
                    'name': 'Receive crypto',
                    value: 'receive'
                },
                {
                    key: 'balance',
                    'name': 'View your crypto wallet balance',
                    value: 'balance'
                },
                new inquirer.Separator('\n'),
                new inquirer.Separator(),
                'Exit',
            ]
        }
    ]

    inquirer
    .prompt(options)
    .then( (answers) => {    
        console.log(`You want to send crypto.`);
        if (answers.wallet == 'send') {
            sendView(user)
        }
        else if (answers.wallet == 'receive') {
        console.log(`You want to receive crypto.`);
            Wallet.receive(user, (result) => {
                if (result.error) {
                    ui.log.write("Could not retrieve crypto wallet address. Crypto Wallet Address may not be found.");
                    return;
                }

                ui.log.write(`Enter your crypto wallet address: ${result.row.address}`);
                return;
            })
        }
        else {
            Wallet.balance(user, (result) => {
                if (result.error) {
                    ui.log.write("Could not retrieve wallet balance. Wallet Address may not be found.");
                    return;
                }

                ui.log.write(`Your crypto balance: ${result.available_balance}`);
                ui.log.write(`Your pending crypto balance: ${result.pending_received_balance}`)
                return;
            })
        }
    })
    .catch( (error) => {

        console.log(error)
    })
}
