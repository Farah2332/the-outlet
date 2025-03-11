import React, { useState } from "react";
import { Navbar, Nav, Container, Form, FormControl, Button, NavDropdown } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaShoppingCart } from "react-icons/fa";

const MyNavbar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        console.log("Searching for:", searchTerm);

        // Navigate to the home page with search parameters
        // This ensures we always navigate to home with the search term
        navigate(`/?searchTerm=${encodeURIComponent(searchTerm.trim())}`);

        // Clear the search input after searching
        setSearchTerm("");
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="py-3 w-100">
            <Container fluid>
                {/* Logo */}
                <Navbar.Brand as={Link} to="/" className="fw-bold fs-3 ms-5">
                    The Outlet
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="d-flex w-100 justify-content-start">
                    {/* Navigation Links */}
                    <Nav className="d-flex ms-auto">
                        <Nav.Link as={Link} to="/" className="mx-2">Home</Nav.Link>
                        <Nav.Link as={Link} to="/Women" className="mx-2">Women</Nav.Link>
                        <Nav.Link as={Link} to="/Men" className="mx-2">Men</Nav.Link>
                    </Nav>
                    {/* Search Bar */}
                    <Form className="d-flex mx-3" onSubmit={handleSearch}>
                        <FormControl
                            type="text"
                            placeholder="Search for pants, shirts, men, etc..."
                            className="me-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="outline-light" type="submit">Search</Button>
                    </Form>
                    {/* User Dropdown (Sign In / Sign Up) */}
                    <NavDropdown title={<FaUser size={24} />} id="user-dropdown" className="text-white mx-3">
                        <NavDropdown.Item as={Link} to="/Login">Sign In</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/Register">Sign Up</NavDropdown.Item>
                    </NavDropdown>
                    {/* Shopping Cart */}
                    <Nav.Link as={Link} to="/ShoppingCart" className="text-white mx-2">
                        <FaShoppingCart size={24} />
                    </Nav.Link>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default MyNavbar;