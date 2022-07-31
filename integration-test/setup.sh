#!/usr/bin/env bash

# Finish Nextcloud installation
php occ maintenance:install -n --admin-user=root --admin-pass=root

# Disable all security policy checks for passwords
php occ config:app:set password_policy enforceNonCommonPassword --value false
php occ config:app:set password_policy enforceUpperUpperCase --value false
php occ config:app:set password_policy enforceUpperLowerCase --value false
php occ config:app:set password_policy enforceNumericCharacters --value false
php occ config:app:set password_policy enforceSpecialCharacters --value false
php occ config:app:set password_policy enforceHaveIBeenPwned --value false
php occ config:app:set password_policy minLength --value 0
php occ config:app:set password_policy historySize --value 0
php occ config:app:set password_policy expiration --value 0
php occ config:app:set password_policy maximumLoginAttempts --value 0

# Create the test user
OC_PASS=testsecret
php occ user:add --password-from-env testuser
