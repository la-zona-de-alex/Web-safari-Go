-- Script de inicialización para Web Safari
-- Crea las tablas mínimas esperadas por backend/api/src/index.js

CREATE DATABASE IF NOT EXISTS WebSafari;
GO
USE WebSafari;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NULL,
        email NVARCHAR(200) NOT NULL UNIQUE,
        password NVARCHAR(500) NULL,
        role NVARCHAR(50) NOT NULL,
        verified BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID('dbo.DriverFiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DriverFiles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        file_type NVARCHAR(100) NOT NULL,
        file_path NVARCHAR(500) NOT NULL,
        original_name NVARCHAR(255) NULL,
        uploaded_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_DriverFiles_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id)
    );
END
GO

IF OBJECT_ID('dbo.RideRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RideRequests (
        request_id INT IDENTITY(1,1) PRIMARY KEY,
        passenger_id INT NOT NULL,
        driver_id INT NULL,
        status NVARCHAR(50) DEFAULT 'pending',
        requested_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        matched_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        price DECIMAL(10,2) NULL,
        origin_address NVARCHAR(500) NULL,
        dest_address NVARCHAR(500) NULL
    );
END
GO
