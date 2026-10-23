require 'open3'

# コミットごとにチェックアウトせず、履歴の増減行数を積み上げて日ごとの行数を出す
log, = Open3.capture2('git', 'log', '--first-parent', '--diff-merges=first-parent', '--reverse', '--date=short', '--format=C %cd',
                      '--numstat', '--no-renames', '--', '*.org')

lines = 0
date = nil
ret = {}
log.each_line do |line|
  case line
  when /\AC (\S+)/ then date = Regexp.last_match(1)
  when /\A(\d+)\t(\d+)\t/ then lines += Regexp.last_match(1).to_i - Regexp.last_match(2).to_i
  end
  ret[date] = lines if date
end

puts ret.map { |d, c| "#{d},#{c}" }
