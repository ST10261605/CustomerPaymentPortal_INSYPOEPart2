# International Payment System: Overview

The international payment system is a banking platform that enables customers to make secure international payments while bank staff are provided with a portal that verifies and processes the transactions through SWIFT.


# System Architecture

•	Customer Portal: a React-based web application for customer transactions

•	Staff Portal: an internet portal for payment verification and processing

•	Backend API: a secure REST API which handles business logic and data persistence


# Security Features
## Authentication and Authorisation

•	Password Security: all passwords are hashed and salted using an industry-standard algorithm

•	Multifactor authentication: authentication for both customers and bank staff

•	Session Management: contains secure timeout policies


## Input Validation

•	Whitelist-based input validation: RegEx patterns are used for all user inputs

•	Server-side validation and client-side checks

•	SQL Injection Protection: using parameterised queries and input sanitisation


## Network Security

•	SSL/TLS Encryption: all traffic is served over HTTPS

•	DDoS Protection: using Rate Limiting and Request Filtering

•	Man-in-the-Middle attack prevention: using a strict TLS configuration


## Attack Mitigation

•	Cross-Site Scripting: has CSP (Content Security Policy) and output encoding

•	Clickjacking protection: using X-Frame-Options and Frame-Ancestors headers

•	Session Jacking prevention: using secure cookie flags and CSRF tokens



# User Roles
## Customers

### Registration

o	Provide their Name, ID, Account Number and Password

o	All information is validated against banking records

###   Payment Process

o	Login with their username, account number and password

o	Enter the payment amount and select a currency

o	Choose the payment provider (in this case, it’s usually: SWIFT)

o	Finalise with the "Pay Now" option


## Bank Staff

•	Employees are pre-registered only

•	There’s no public registration available

•	Their access is dedicated to the international payments’ portal

•	They verify payee or customer account information and the SWIFT codes

•	The process transactions by clicking the "Verified" and "Submit" 




# Technical Implementation
## Frontend

•	React is used for the Frontend

•	RegEx patterns for input validation

•	HTTPS is enforced

•	Has CSRF token management

•	Has secure session handling

## Backend

•	Using an API

•	Input Sanitisation: all the endpoints validate and sanitize inputs

•	Authentication Middleware: we have a JWT-based authentication

•	Rate Limiting: preventing brute force and DDoS attacks

•	Audit Logging:  tracks all transaction activities


# Database Security

We have the following:

•	Encrypted sensitive data

•	Parameterised queries

•	Least privilege access

•	Regular security audits


# Compliance and Standards

•	SWIFT Compliance: adheres to the SWIFT security requirements

•	Banking Regulations: complies with the international banking standards

•	Data Protection: follows local data protection laws




# Development Requirements
## Prerequisites

•	Node.js (latest version: 24.9.0)

•	Visual Studio Code

•	React (latest version: 19)

•	Secure SSL Certificate

•	Database System

# Security Checklist

Ensure the following is adhered to:

•	All passwords are hashed with salt

•	Input validation is using RegEx whitelists

•	SSL/TLS is enabled on all endpoints

•	XSS protection headers are configured

•	CSRF tokens have been implemented

•	Have SQL injection prevention measures

•	Session security is configured

•	Have DDoS protection mechanisms

•	Have regular security dependency updates


# First Time Setup - SSL Certificate

When you first run the project, browsers will show security warnings because we use self-signed certificates for local development.

## To fix this:

1. *Chrome/Edge*: Click "Advanced" → "Proceed to localhost (unsafe)"
2. *Firefox*: Click "Advanced" → "Accept the Risk and Continue"
3. *Or trust the certificate permanently* (optional):
   - Import ssl/certificate.pem into your Trusted Root Certification Authorities

# Note for Deployment

•	SSL Configuration: ensure valid SSL certificates from trusted CAs

•	Environment Variables: secure storage of database credentials and API keys

•	Firewall Rules: restrict access to necessary ports only

•	Monitoring: implement security monitoring and alerting
