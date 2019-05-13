import React, { Component } from 'react';
import Button from './Button';

class ProfileView extends Component {
    render() {
        return (
            <div>
                Delete your profile: <Button icon="icono-trash"/>
            </div>    
        );
    }
}

export default ProfileView;