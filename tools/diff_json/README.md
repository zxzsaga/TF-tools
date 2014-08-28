# 说明
diffJSON.js 是生成 diff 文件的的执行程序，patchJSON.js 是将 diff 文件作用于旧文件生成新文件的执行程序。

diff.sh 和 patch.sh 分别是批量执行上述两个程序的脚本。
# 使用方法
## diff.sh
在 diff.sh 中写入执行 diffJSON.js 的参数，格式为：

node diffJSON.js /path_of_old_file /path_of_new_file /path_of_diff_store

对结构较为复杂的 cn_helps.json 文件使用 -s 参数，格式为：

node diffJSON.js -s /path_of_old_file /path_of_new_file /path_of_diff_store
## patch.sh
在 patch.sh 中写入执行 patchJSON.js 的参数，格式为：

node patchJSON.js /path_of_old_file /path_of_diff_file /path_of_new_file

对结构较为复杂的 cn_helps.json 文件使用 -s 参数，格式为：

node patchJSON.js -s /path_of_old_file /path_of_diff_file /path_of_new_file
