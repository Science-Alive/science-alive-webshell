#!/bin/bash
# Save username to environment so .bashrc can use it
echo "export USERNAME=$USERNAME" >> /home/student/.bashrc
echo 'PS1="\[\033[01;32m\]$USERNAME@terminal\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> /home/student/.bashrc

exec /bin/bash