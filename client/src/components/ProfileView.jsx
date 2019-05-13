import React, { Component } from 'react';
import Button from './Button';

class ProfileView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: "",
            password: "",
            password2: "",
            firstname: "",
            lastname: "",
            valid: false,
            error: Error("Please input your credentials")
        };
    }
    componentDidMount = () => this.props.user ? null : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }


    render() {
        return (
            <div>
                <section>
                    <h2>
                    Delete your profile
                    </h2>
                    <label>Your ranking and past games will not be recoverable.</label>
                    <Button icon="icono-trash"/>
                </section>    
                <form>
                    <h2>
                        Edit your profile
                    </h2>
                    {this.state.valid 
                        ? null 
                        : <output className="has-text-grey is-size-7">{this.state.error.message}</output>}
                    <input 
                        type="email"
                        className="field input"
                        autoComplete="username"
                        placeholder="Email Address" 
                        name="_id" 
                        onChange={this.onUpdate}/>
                    <input 
                        className="field input"
                        type="password" 
                        placeholder="Password" 
                        name="password" 
                        onChange={this.onUpdate}/>
                    <input 
                        className="field input" 
                        type="password" 
                        autoComplete="new-password"
                        placeholder="Retype Password" 
                        name="password2" 
                        onChange={this.onUpdate}/>
                    <input 
                        className="field input" 
                        autoComplete="given-name"
                        placeholder="First Name" 
                        name="firstname" 
                        onChange={this.onUpdate}/>
                    <input 
                        className="field input" 
                        autoComplete="family-name"
                        placeholder="Last Name" 
                        name="lastname" 
                        onChange={this.onUpdate}/>
                    <Button icon="icono-check" />
                </form>    
            </div>
        );
    }
}

export default ProfileView;