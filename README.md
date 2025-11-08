# International Payment System: Overview

The international payment system is a banking platform that enables customers to make secure international payments while bank staff are provided with a portal that verifies and processes the transactions through SWIFT. (Note: Please refer to the Demo Video to view all the functioning features)


# System Architecture

•	Customer Portal: a React-based web application for customer transactions

•	Staff Portal: an internet portal for payment verification and processing

•	Backend API: a secure REST API which handles business logic and data persistence

•	CI/CD Pipeline: the GitHub repository with integrated CircleCI for automated testing and security scanning


# Security Features
## Authentication and Authorisation

•	Password Security: all passwords are hashed and salted using an industry-standard algorithm

•	Multifactor authentication: authentication for both customers and bank staff

•	Session Management: contains secure timeout policies

•	Pre-registered users: employee or staff have no public registration process

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

•	SQL Injection Attacks: preparing statements and ORM usage

•	Cross-site Request Forgery (CSRF): having implemented anti-CSRF tokens


# Development and Deployment Pipeline
## CI/CD with CircleCI

•	Provided automated builds on every commit

•	SonarQube integration provides code quality analysis

•	There is security scanning for any vulnerabilities


## SonarQube Integration

•	Code Quality Analysis: providing continuous monitoring of code smells and technical issues

• Security Hotspots: provides identification and tracking of security vulnerabilities

• Quality Gates: provides automated quality checks before deployment

• Coverage Reports: test coverage analysis and reporting

• Automated Scans: the scans are triggered on every pull request and main branch commit

• Quality metrics include maintainability of rating, reliability of rating, security rating and coverage percentage


# User Management

• No Public Registration (for employees): the employees are registered by admins

• Account Validation: all user accounts are validated against banking records

• Role-based Access: there's a strict separation between customer and employee privileges


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

•  User Management API: there are internal endpoints for user creation only


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

•  CI/CD Security: secure pipeline configuration and management


# Development Requirements
## Prerequisites

•	Node.js (latest version: 24.9.0)

•	Visual Studio Code

•	React (latest version: 19)

•	Secure SSL Certificate

•	Database System

• SonarQube server access

• CircleCI account


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

• No user registration endpoints are publicly exposed

• SonarQube quality gates are passing

• CircleCI pipeline security is configured

# Demonstration Video

https://youtu.be/biL1HnA3VPo

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

• Pipeline Security: secure CircleCI context and environment variables

